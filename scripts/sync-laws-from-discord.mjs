#!/usr/bin/env node
/**
 * Liest die drei Gesetz-Channels und schreibt daraus die Markdown-Dateien in
 * content/. Jede Nachricht ist ein einzelnes Gesetz; die Reihenfolge entspricht
 * der Reihenfolge im Channel.
 *
 * Benötigt:
 *   DISCORD_BOT_TOKEN   Bot-Token
 *   DISCORD_GUILD_ID    Server-ID
 *
 * Optional:
 *   DRY_RUN             true = nur anzeigen, nichts schreiben
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DOCUMENTS } from "./law-documents.mjs";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "";
const CONTENT_DIR = process.env.CONTENT_DIR ?? "content";
const DRY_RUN = ["1", "true", "yes"].includes(String(process.env.DRY_RUN).toLowerCase());
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, attempt = 0) {
  let response;
  try {
    response = await fetch(`${API}${pathname}`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(1_000 * 2 ** attempt);
    return api(pathname, attempt + 1);
  }

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const wait = Math.ceil((data.retry_after ?? 1) * 1000);
    console.warn(`Rate limit – warte ${wait} ms`);
    await sleep(wait);
    return api(pathname, attempt);
  }

  if (response.status >= 500) {
    if (attempt >= 4) throw new Error(`Discord API HTTP ${response.status}`);
    await sleep(1_000 * 2 ** attempt);
    return api(pathname, attempt + 1);
  }

  if (!response.ok) {
    const details = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`${pathname}: HTTP ${response.status} ${details}`);
  }

  return response.json();
}

async function fetchAllMessages(channelID) {
  const all = [];
  let before = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (before) params.set("before", before);

    const batch = await api(`/channels/${channelID}/messages?${params.toString()}`);
    all.push(...batch);
    if (batch.length < PAGE_SIZE) return all;

    before = batch[batch.length - 1].id;
    await sleep(500);
  }

  console.warn(`Warnung: Nach ${MAX_PAGES} Seiten abgebrochen (MAX_PAGES).`);
  return all;
}

export function isUsableMessage(message) {
  if (message.webhook_id) return false;
  if (![0, 19].includes(message.type ?? 0)) return false;
  return typeof message.content === "string" && message.content.trim().length > 0;
}

export function buildDocumentFile(doc, channel, messages, guildID = GUILD_ID) {
  const sorted = [...messages].sort((a, b) =>
    BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0,
  );

  const body = sorted
    .map((message) => message.content.trim())
    .join(doc.separator)
    .trim();

  const url = `https://discord.com/channels/${guildID}/${channel.id}`;

  return [
    `<!-- Automatisch aus Discord #${channel.name} generiert. Nicht direkt bearbeiten. -->`,
    `<!-- discord-channel:${channel.id} -->`,
    `<!-- discord-guild:${guildID} -->`,
    `<!-- discord-channel-url:${url} -->`,
    "",
    body,
    "",
  ].join("\n");
}

async function main() {
  if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN fehlt.");
  if (!/^\d{17,20}$/.test(GUILD_ID)) {
    throw new Error("DISCORD_GUILD_ID fehlt oder ist keine gültige Server-ID.");
  }

  const channels = await api(`/guilds/${GUILD_ID}/channels`);
  const map = {};
  let changed = 0;

  for (const doc of DOCUMENTS) {
    const channel = channels.find(
      (entry) => entry.type === 0 && entry.name === doc.channel,
    );

    if (!channel) {
      console.warn(`Channel #${doc.channel} nicht gefunden – ${doc.file} bleibt unverändert.`);
      continue;
    }

    const messages = (await fetchAllMessages(channel.id)).filter(isUsableMessage);
    if (messages.length === 0) {
      console.warn(`#${doc.channel} enthält keine Gesetze – ${doc.file} bleibt unverändert.`);
      continue;
    }

    const content = buildDocumentFile(doc, channel, messages);
    const target = path.join(CONTENT_DIR, doc.file);
    let current = "";
    try {
      current = await readFile(target, "utf8");
    } catch {
      // Datei existiert noch nicht
    }

    map[doc.title] = {
      id: channel.id,
      name: channel.name,
      url: `https://discord.com/channels/${GUILD_ID}/${channel.id}`,
    };

    if (current === content) {
      console.log(`${doc.file}: keine Änderung (${messages.length} Gesetze).`);
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `[dry-run] ${doc.file}: ${messages.length} Gesetze, ${content.length} Zeichen.`,
      );
      continue;
    }

    await mkdir(CONTENT_DIR, { recursive: true });
    await writeFile(target, content, "utf8");
    changed += 1;
    console.log(`${doc.file}: ${messages.length} Gesetze aktualisiert.`);
  }

  const mapFile = path.join(CONTENT_DIR, "discord-channels.json");
  const mapContent = `${JSON.stringify(map, null, 2)}\n`;
  let currentMap = "";
  try {
    currentMap = await readFile(mapFile, "utf8");
  } catch {
    // no map yet
  }

  if (!DRY_RUN && currentMap !== mapContent) {
    await mkdir(CONTENT_DIR, { recursive: true });
    await writeFile(mapFile, mapContent, "utf8");
    changed += 1;
  }

  if (!DRY_RUN) console.log(`Fertig. ${changed} Datei(en) geändert.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Fehler: ${error.message}`);
    process.exitCode = 1;
  });
}
