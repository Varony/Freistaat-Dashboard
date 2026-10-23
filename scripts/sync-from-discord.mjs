#!/usr/bin/env node
/**
 * Liest einen Discord-Channel und schreibt das Gesetzblatt nach content/Gesetze.md.
 *
 * Discord ist die Quelle: Die Datei wird bei jedem Lauf vollständig neu
 * erzeugt. Änderungen in GitHub werden dadurch überschrieben. Der Channel
 * enthält ausschließlich Gesetze, daher wird jede menschliche Nachricht
 * übernommen.
 *
 * Benötigt:
 *   DISCORD_BOT_TOKEN   Bot-Token (Message Content Intent aktiv!)
 *   DISCORD_CHANNEL_ID  ID des Gesetzblatt-Channels
 *
 * Optional:
 *   SYNC_FILE, SYNC_TITLE, DRY_RUN, MAX_PAGES
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID ?? "";
const OUT = process.env.SYNC_FILE ?? "content/Gesetze.md";
const TITLE = process.env.SYNC_TITLE ?? "Gesetzblatt des Freistaats";
const DRY_RUN = isTrue(process.env.DRY_RUN);
const MAX_PAGES = Number(process.env.MAX_PAGES ?? 50);
const PAGE_SIZE = 100;
const DELAY_MS = 500;

function isTrue(value) {
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, attempt = 0) {
  let response;

  try {
    response = await fetch(`${API}${pathname}`, {
      headers: {
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(1000 * 2 ** attempt);
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
    if (attempt >= 4) {
      throw new Error(`Discord API HTTP ${response.status} (nicht erreichbar)`);
    }
    await sleep(1000 * 2 ** attempt);
    return api(pathname, attempt + 1);
  }

  if (response.status === 401) {
    throw new Error(
      "Discord antwortet mit 401: Der Bot-Token ist ungültig oder wurde zurückgesetzt.",
    );
  }

  if (response.status === 403) {
    throw new Error(
      "Discord antwortet mit 403: Dem Bot fehlen Rechte. Benötigt werden " +
        "„Channel ansehen“ und „Nachrichtenverlauf lesen“.",
    );
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Discord API HTTP ${response.status}: ${details.slice(0, 300)}`);
  }

  return response.json();
}

async function fetchChannel() {
  try {
    const channel = await api(`/channels/${CHANNEL_ID}`);
    return {
      id: channel?.id ?? CHANNEL_ID,
      name: channel?.name ?? CHANNEL_ID,
      guildID: channel?.guild_id ?? null,
      type: channel?.type ?? null,
    };
  } catch (error) {
    console.warn(
      `Channel-Info konnte nicht geladen werden (${error.message}). ` +
        "Der Sync läuft ohne Namen und ohne Discord-Links weiter.",
    );
    return { id: CHANNEL_ID, name: CHANNEL_ID, guildID: null, type: null };
  }
}

/**
 * Discord liefert die neuesten Nachrichten zuerst. Wir blättern mit "before"
 * rückwärts, bis eine Seite weniger als 100 Nachrichten enthält.
 */
async function fetchAllMessages() {
  const all = [];
  let before = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (before) params.set("before", before);

    const batch = await api(`/channels/${CHANNEL_ID}/messages?${params.toString()}`);
    if (!Array.isArray(batch)) {
      throw new Error("Unerwartete Antwort von Discord: keine Nachrichtenliste.");
    }

    all.push(...batch);
    if (batch.length < PAGE_SIZE) return all;

    before = batch[batch.length - 1].id;
    await sleep(DELAY_MS);
  }

  console.warn(`Warnung: Nach ${MAX_PAGES} Seiten abgebrochen (MAX_PAGES).`);
  return all;
}

function isLawMessage(message) {
  if (message.webhook_id) return false; // vom alten Webhook gepostet
  if (message.author?.bot) return false;
  if (![0, 19].includes(message.type ?? 0)) return false; // 0 = normal, 19 = Antwort

  const hasText = typeof message.content === "string" && message.content.trim().length > 0;
  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
  return hasText || hasAttachments;
}

function messageText(message) {
  const parts = [];

  if (message.content?.trim()) parts.push(message.content.trim());

  for (const attachment of message.attachments ?? []) {
    const name = attachment.filename ?? "Anhang";
    if (attachment.url) parts.push(`[${name}](${attachment.url})`);
  }

  return parts.join("\n");
}

function cleanTitle(value) {
  const title = String(value ?? "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return title.slice(0, 120) || "Ohne Titel";
}

function defaultTitle(message) {
  const date = new Date(message?.timestamp ?? "");
  if (Number.isNaN(date.getTime())) return "Gesetz";
  const formatted = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(date);
  return `Gesetz vom ${formatted}`;
}

/**
 * Verhindert, dass Überschriften im Gesetzestext vom Parser in lib/laws.ts
 * als neuer "## "-Abschnitt interpretiert werden.
 */
function protectBody(value) {
  return String(value ?? "").replace(/^(#{2,5})\s+/gm, (_, hashes) => `${hashes}# `);
}

/**
 * Eine Nachricht wird zu einem Gesetz:
 * - erste Zeile ist eine Markdown-Überschrift → Titel, Rest ist Text
 * - erste Zeile ist kurz → Titel, Rest ist Text
 * - sonst → "Gesetz vom …", kompletter Text bleibt erhalten
 */
function splitTitle(text, message) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const first = lines[0]?.trim() ?? "";

  const heading = first.match(/^#{1,6}\s+(.+)$/);
  if (heading) {
    return {
      title: cleanTitle(heading[1]),
      body: protectBody(lines.slice(1).join("\n").trim()),
    };
  }

  if (first.length > 0 && first.length <= 100 && lines.length > 1) {
    return {
      title: cleanTitle(first),
      body: protectBody(lines.slice(1).join("\n").trim()),
    };
  }

  return { title: defaultTitle(message), body: protectBody(normalized) };
}

function buildMarkdown(messages, channel = {}) {
  const sorted = [...messages].sort((a, b) =>
    BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0,
  );

  const channelID = channel.id ?? CHANNEL_ID;
  const guildID = channel.guildID ?? null;
  const channelName = String(channel.name ?? CHANNEL_ID).replace(/--+/g, "-");
  const channelURL =
    guildID && channelID
      ? `https://discord.com/channels/${guildID}/${channelID}`
      : null;

  const blocks = sorted.map((message) => {
    const { title, body } = splitTitle(messageText(message), message);
    const messageURL =
      guildID && channelID
        ? `https://discord.com/channels/${guildID}/${channelID}/${message.id}`
        : null;

    const lines = [`## ${title}`, "", `<!-- discord:${message.id} -->`];
    if (message.timestamp) lines.push(`<!-- passed:${message.timestamp} -->`);
    if (body) lines.push("", body);
    if (messageURL) lines.push("", `[Im Discord ansehen](${messageURL})`);

    return lines.join("\n");
  });

  return [
    `# ${TITLE}`,
    "",
    `<!-- Automatisch aus Discord #${channelName} generiert. Nicht direkt bearbeiten. -->`,
    `<!-- discord-channel:${channelID} -->`,
    guildID ? `<!-- discord-guild:${guildID} -->` : null,
    `<!-- discord-channel-name:${channelName} -->`,
    channelURL ? `<!-- discord-channel-url:${channelURL} -->` : null,
    "",
    blocks.join("\n\n---\n\n"),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function main() {
  if (!TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN fehlt.");
  }
  if (!/^\d{17,20}$/.test(CHANNEL_ID)) {
    throw new Error("DISCORD_CHANNEL_ID fehlt oder ist keine gültige Channel-ID.");
  }

  const channel = await fetchChannel();
  if (channel.type === 15) {
    throw new Error(
      "Forum-Channels werden noch nicht unterstützt. Nutze einen normalen Text-Channel " +
        "oder einen einzelnen Thread.",
    );
  }

  const messages = await fetchAllMessages();
  const relevant = messages.filter(isLawMessage);

  if (relevant.length === 0) {
    throw new Error(
      "Keine verwertbaren Nachrichten gefunden. Prüfe: Ist der Bot im Channel? " +
        "Ist das „Message Content Intent“ im Developer Portal aktiv? " +
        "Gibt es Nachrichten von Menschen?",
    );
  }

  const markdown = buildMarkdown(relevant, channel);

  let current = "";
  try {
    current = await readFile(OUT, "utf8");
  } catch {
    // Datei existiert noch nicht
  }

  if (current === markdown) {
    console.log(`Keine Änderung (${relevant.length} Nachrichten).`);
    return;
  }

  if (DRY_RUN) {
    console.log(
      `[dry-run] ${relevant.length} Nachrichten → ${markdown.length} Zeichen. ` +
        `Datei ${OUT} würde aktualisiert.`,
    );
    return;
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, markdown, "utf8");
  console.log(`Aktualisiert: ${relevant.length} Nachrichten, ${markdown.length} Zeichen.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Fehler: ${error.message}`);
    process.exitCode = 1;
  });
}

export { buildMarkdown, isLawMessage, messageText, splitTitle };
