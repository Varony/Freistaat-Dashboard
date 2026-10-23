#!/usr/bin/env node
/**
 * Legt pro Gesetzestext einen Discord-Channel an und postet jedes einzelne
 * Gesetz als eigene Nachricht. Der Publish-State wird in
 * content/discord-publish-state.json gespeichert, damit spätere Läufe
 * Nachrichten aktualisieren statt zu duplizieren.
 *
 * Benötigt:
 *   DISCORD_BOT_TOKEN          Bot-Token
 *   DISCORD_GUILD_ID           Server-ID
 *
 * Optional:
 *   DISCORD_INDEX_CHANNEL_ID   Channel für die Übersicht (z. B. #gestze)
 *   DRY_RUN                    true = nur anzeigen, nichts schreiben
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOCUMENTS, chunkForDiscord, normalizeForDiscord, splitDocument } from "./law-documents.mjs";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "";
const INDEX_CHANNEL_ID = process.env.DISCORD_INDEX_CHANNEL_ID ?? "";
const CONTENT_DIR = process.env.CONTENT_DIR ?? "content";
const STATE_FILE = process.env.PUBLISH_STATE ?? path.join(CONTENT_DIR, "discord-publish-state.json");
const DRY_RUN = ["1", "true", "yes"].includes(String(process.env.DRY_RUN).toLowerCase());
const INVITE_PERMISSIONS = 76816; // View Channel, Manage Channels, Send Messages, Manage Messages, Read Message History
const INDEX_MARKER = "Die Gesetze sind jetzt in eigenen Channels organisiert";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, options = {}) {
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API}${pathname}`, { ...options, headers });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const wait = Math.ceil((data.retry_after ?? 1) * 1000);
    console.warn(`Rate limit – warte ${wait} ms`);
    await sleep(wait);
    return api(pathname, options);
  }

  if (response.status >= 500) {
    await sleep(1_000);
    return api(pathname, options);
  }

  if (!response.ok) {
    const details = (await response.text().catch(() => "")).slice(0, 500);
    const error = new Error(`${pathname}: HTTP ${response.status} ${details}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function inviteUrl() {
  try {
    const app = await api("/oauth2/applications/@me");
    return (
      `https://discord.com/oauth2/authorize?client_id=${app.id}` +
      `&permissions=${INVITE_PERMISSIONS}&scope=bot%20applications.commands`
    );
  } catch {
    return null;
  }
}

function hash(text) {
  return createHash("sha1").update(text).digest("hex");
}

function headingOf(text) {
  const first = text.split("\n")[0].trim();
  return first.length > 80 ? `${first.slice(0, 79)}…` : first || "(ohne Überschrift)";
}

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return { guildID: GUILD_ID, documents: {}, index: {} };
  }
}

async function writeState(state) {
  if (DRY_RUN) return false;
  const content = `${JSON.stringify(state, null, 2)}\n`;
  let current = "";
  try {
    current = await readFile(STATE_FILE, "utf8");
  } catch {
    // no state yet
  }
  if (current === content) return false;
  await writeFile(STATE_FILE, content, "utf8");
  return true;
}

async function messageExists(channelID, messageID) {
  try {
    await api(`/channels/${channelID}/messages/${messageID}`);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    throw error;
  }
}

async function postMessage(channelID, content) {
  return api(`/channels/${channelID}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
}

async function editMessage(channelID, messageID, content) {
  return api(`/channels/${channelID}/messages/${messageID}`, {
    method: "PATCH",
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
}

async function deleteMessage(channelID, messageID) {
  return api(`/channels/${channelID}/messages/${messageID}`, { method: "DELETE" });
}

async function ensureChannel(channels, doc) {
  const existing = channels.find((channel) => channel.type === 0 && channel.name === doc.channel);
  if (existing) return { channel: existing, created: false };
  if (DRY_RUN) return { channel: { id: null, name: doc.channel }, created: true };

  try {
    const channel = await api(`/guilds/${GUILD_ID}/channels`, {
      method: "POST",
      body: JSON.stringify({ name: doc.channel, type: 0 }),
    });
    return { channel, created: true };
  } catch (error) {
    if (error.status === 403) {
      const url = await inviteUrl();
      throw new Error(
        "Dem Bot fehlt das Recht „Channels verwalten“. Lade ihn neu ein" +
          (url ? `: ${url}` : "."),
      );
    }
    throw error;
  }
}

async function syncUnit(channelID, unit, previous) {
  const content = normalizeForDiscord(unit);
  const chunks = chunkForDiscord(content);
  const unitHash = hash(content);
  const previousIDs = previous?.messageIDs ?? (previous?.id ? [previous.id] : []);

  if (!DRY_RUN && previousIDs.length === chunks.length && previous?.hash === unitHash) {
    let allExist = true;
    for (const id of previousIDs) {
      if (!(await messageExists(channelID, id))) {
        allExist = false;
        break;
      }
    }
    if (allExist) return { ...previous, hash: unitHash };
  }

  const messageIDs = [];
  for (const [index, chunk] of chunks.entries()) {
    if (DRY_RUN) {
      messageIDs.push(null);
      continue;
    }

    const existingID = previousIDs[index];
    if (existingID && (await messageExists(channelID, existingID))) {
      await editMessage(channelID, existingID, chunk);
      messageIDs.push(existingID);
    } else {
      const message = await postMessage(channelID, chunk);
      messageIDs.push(message.id);
    }
    await sleep(1_000);
  }

  if (!DRY_RUN) {
    for (const staleID of previousIDs.slice(chunks.length)) {
      await deleteMessage(channelID, staleID).catch((error) =>
        console.warn(`Alte Nachricht ${staleID} konnte nicht gelöscht werden: ${error.message}`),
      );
    }
  }

  return { index: previous?.index, heading: headingOf(content), messageIDs, hash: unitHash };
}

async function publishIndex(state, docs) {
  if (!INDEX_CHANNEL_ID) return false;

  const content = [
    "# Gesetzblatt",
    "",
    `${INDEX_MARKER}:`,
    "",
    ...docs.map(({ title, channel }) => `- <#${channel.id}> – ${title}`),
  ].join("\n");

  const previous = state.index ?? {};
  if (DRY_RUN) {
    console.log(`[dry-run] Übersicht in ${INDEX_CHANNEL_ID} würde aktualisiert.`);
    state.index = { channelID: INDEX_CHANNEL_ID, messageID: previous.messageID ?? null };
    return false;
  }

  if (previous.messageID && previous.channelID === INDEX_CHANNEL_ID) {
    if (await messageExists(INDEX_CHANNEL_ID, previous.messageID)) {
      await editMessage(INDEX_CHANNEL_ID, previous.messageID, content);
      return false;
    }
  }

  const message = await postMessage(INDEX_CHANNEL_ID, content);
  state.index = { channelID: INDEX_CHANNEL_ID, messageID: message.id };
  console.log("Übersicht in #gestze gepostet.");
  await sleep(1_000);
  return true;
}

async function main() {
  if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN fehlt.");
  if (!/^\d{17,20}$/.test(GUILD_ID)) {
    throw new Error("DISCORD_GUILD_ID fehlt oder ist keine gültige Server-ID.");
  }

  const state = await readState();
  state.guildID = GUILD_ID;
  state.documents ??= {};

  let channels = await api(`/guilds/${GUILD_ID}/channels`);
  if (DRY_RUN) {
    const names = channels
      .filter((channel) => channel.type === 0)
      .map((channel) => `#${channel.name}`)
      .join(", ");
    console.log(`Vorhandene Text-Channels: ${names}`);
  }

  const published = [];

  for (const doc of DOCUMENTS) {
    const source = await readFile(path.join(CONTENT_DIR, doc.file), "utf8");
    const units = splitDocument(source, doc);
    if (units.length === 0) {
      console.warn(`Keine Einheiten in ${doc.file} – übersprungen.`);
      continue;
    }

    const { channel, created } = await ensureChannel(channels, doc);
    if (created && !DRY_RUN) {
      channels = [...channels, channel];
      console.log(`Channel #${doc.channel} erstellt.`);
      await sleep(1_000);
    }

    if (!channel.id) {
      console.log(`[dry-run] #${doc.channel}: ${units.length} Gesetze würden gepostet.`);
      published.push({ title: doc.title, channel });
      continue;
    }

    const docState = state.documents[doc.title] ?? { messages: [] };
    docState.channelID = channel.id;
    docState.channelName = channel.name;
    docState.url = `https://discord.com/channels/${GUILD_ID}/${channel.id}`;
    docState.messages ??= [];

    const nextMessages = [];
    for (const [index, unit] of units.entries()) {
      const previous = docState.messages[index];
      const next = await syncUnit(channel.id, unit, previous);
      next.index = index;
      nextMessages.push(next);
      if (DRY_RUN) console.log(`[dry-run] #${doc.channel}: ${next.heading}`);
    }

    for (const stale of docState.messages.slice(units.length)) {
      const ids = stale.messageIDs ?? (stale.id ? [stale.id] : []);
      if (DRY_RUN) {
        console.log(`[dry-run] #${doc.channel}: alte Nachricht(en) würden entfernt.`);
        continue;
      }
      for (const id of ids) {
        await deleteMessage(channel.id, id).catch((error) =>
          console.warn(`Alte Nachricht ${id} konnte nicht gelöscht werden: ${error.message}`),
        );
      }
    }

    docState.messages = nextMessages;
    state.documents[doc.title] = docState;
    published.push({ title: doc.title, channel });
    console.log(`#${doc.channel}: ${units.length} Gesetze synchronisiert.`);
  }

  await publishIndex(state, published);
  const changed = await writeState(state);
  console.log(
    DRY_RUN
      ? "[dry-run] Fertig."
      : `Fertig.${changed ? " Publish-State aktualisiert." : ""}`,
  );
}

main().catch(async (error) => {
  console.error(`Fehler: ${error.message}`);
  if (error.status === 403) {
    const url = await inviteUrl();
    if (url) console.error(`Benötigte Rechte: ${url}`);
  }
  process.exitCode = 1;
});
