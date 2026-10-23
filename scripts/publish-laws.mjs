#!/usr/bin/env node
/**
 * Postet die manuell gepflegten Gesetzestexte aus content/*.md in den
 * Gesetzblatt-Channel. Jedes Gesetz wird eine Nachricht mit Titel und
 * Markdown-Datei als Anhang. Der Sync liest den Anhang später aus und
 * erzeugt daraus content/Gesetze.md.
 *
 * Benötigt:
 *   DISCORD_BOT_TOKEN   Bot-Token
 *   DISCORD_CHANNEL_ID  Ziel-Channel
 *
 * Optional:
 *   CONTENT_DIR, DRY_RUN
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID ?? "";
const CONTENT_DIR = process.env.CONTENT_DIR ?? "content";
const DRY_RUN = ["1", "true", "yes"].includes(String(process.env.DRY_RUN).toLowerCase());
const GENERATED_FILE = "Gesetze.md";
const ORDER = [
  "Verfassung des Freistaates",
  "Recht und Ordnung",
  "Einstweilige Verfügungen",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, options = {}) {
  const headers = { Authorization: `Bot ${TOKEN}` };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const wait = Math.ceil((data.retry_after ?? 1) * 1000);
    console.warn(`Rate limit – warte ${wait} ms`);
    await sleep(wait);
    return api(pathname, options);
  }

  if (!response.ok) {
    const details = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`${pathname}: HTTP ${response.status} ${details}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function orderIndex(filename) {
  const title = filename.replace(/\.md$/i, "");
  const index = ORDER.indexOf(title);
  return index === -1 ? ORDER.length : index;
}

async function main() {
  if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN fehlt.");
  if (!/^\d{17,20}$/.test(CHANNEL_ID)) {
    throw new Error("DISCORD_CHANNEL_ID fehlt oder ist keine gültige Channel-ID.");
  }

  const entries = await readdir(CONTENT_DIR);
  const files = entries
    .filter((name) => name.toLowerCase().endsWith(".md") && name !== GENERATED_FILE)
    .sort((a, b) => orderIndex(a) - orderIndex(b) || a.localeCompare(b, "de"));

  if (files.length === 0) {
    throw new Error(`Keine Markdown-Dateien in ${CONTENT_DIR} gefunden.`);
  }

  const existing = await api(`/channels/${CHANNEL_ID}/messages?limit=50`);
  const existingAttachments = new Set(
    existing.flatMap((message) =>
      (message.attachments ?? []).map((attachment) => attachment.filename),
    ),
  );

  for (const filename of files) {
    const title = filename.replace(/\.md$/i, "");

    if (existingAttachments.has(filename)) {
      console.log(`Überspringe ${filename} (bereits im Channel).`);
      continue;
    }

    const content = await readFile(path.join(CONTENT_DIR, filename), "utf8");

    if (DRY_RUN) {
      console.log(`[dry-run] ${title}: ${content.length} Zeichen → ${filename}`);
      continue;
    }

    const form = new FormData();
    form.append(
      "payload_json",
      JSON.stringify({
        content: `# ${title}`,
        attachments: [{ id: 0, filename }],
      }),
    );
    form.append(
      "files[0]",
      new Blob([content], { type: "text/markdown; charset=utf-8" }),
      filename,
    );

    const message = await api(`/channels/${CHANNEL_ID}/messages`, {
      method: "POST",
      body: form,
    });
    console.log(`Gepostet: ${title} (Nachricht ${message.id})`);
    await sleep(1_000);
  }

  console.log("Fertig.");
}

main().catch((error) => {
  console.error(`Fehler: ${error.message}`);
  process.exitCode = 1;
});
