#!/usr/bin/env node
/**
 * Synchronisiert eine Markdown-Datei mit einem Discord-Channel.
 *
 * Jeder Abschnitt der Ebene 2 ("## ...") wird zu einer Discord-Nachricht.
 * Änderungen werden in die bestehende Nachricht geschrieben (Pinnwand-Modus),
 * neue Abschnitte werden angehängt, gelöschte Abschnitte werden entfernt.
 *
 * Benötigt: DISCORD_WEBHOOK_URL
 * Optional: SYNC_FILE, SYNC_STATE, DRY_RUN, FORCE
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FILE = process.env.SYNC_FILE ?? "content/Gesetze.md";
const STATE_FILE = process.env.SYNC_STATE ?? ".discord-sync/gesetze.json";
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL ?? "";
const DRY_RUN = isTrue(process.env.DRY_RUN);
const FORCE = isTrue(process.env.FORCE);

const MESSAGE_LIMIT = 1900; // Discord erlaubt 2000; Puffer für Sicherheit
const DELAY_MS = 600; // Webhook-Rate-Limit: 5 Requests / 2 Sekunden

function isTrue(value) {
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

function normalize(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "abschnitt"
  );
}

/**
 * Zerlegt das Markdown in Abschnitte.
 * Optional kann direkt unter der Überschrift eine stabile ID stehen:
 *   ## § 2 – Wahlrecht
 *   <!-- id: wahlrecht -->
 */
function parseSections(markdown) {
  const lines = normalize(markdown).split("\n");
  const raw = [];
  let current = { title: null, lines: [] };

  const flush = () => {
    if (current.title === null && current.lines.every((line) => !line.trim())) return;
    raw.push(current);
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      flush();
      current = { title: heading[1], lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  flush();

  const used = new Map();

  return raw
    .map((block) => {
      let body = block.lines.join("\n").trim();
      let explicitId = null;

      body = body.replace(
        /^(##[^\n]*\n)<!--\s*id:\s*([a-z0-9_-]+)\s*-->\s*\n?/i,
        (_, heading, id) => {
          explicitId = id.toLowerCase();
          return heading;
        },
      );

      const base = explicitId ?? (block.title ? slugify(block.title) : "intro");
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);

      return {
        id: count === 1 ? base : `${base}-${count}`,
        body: body.trim(),
      };
    })
    .filter((section) => section.body.length > 0);
}

/**
 * Teilt langen Text an Zeilengrenzen. Offene Code-Blöcke werden geschlossen
 * und im nächsten Teil wieder geöffnet.
 */
function splitText(text, limit) {
  if (text.length <= limit) return [text];

  const lines = text.split("\n");
  const chunks = [];
  let current = [];
  let length = 0;
  let fence = null;

  const append = (line) => {
    length += (current.length ? 1 : 0) + line.length;
    current.push(line);
  };

  for (const line of lines) {
    const extra = (current.length ? 1 : 0) + line.length;
    const closingFence = fence ? fence.length + 1 : 0;
    if (current.length && length + extra + closingFence > limit) {
      let output = current.join("\n");
      if (fence) output += `\n${fence}`;
      chunks.push(output);

      current = [];
      length = 0;
      if (fence) append(fence);
    }

    if (!current.length && line.length > limit) {
      for (let i = 0; i < line.length; i += limit) {
        chunks.push(line.slice(i, i + limit));
      }
      continue;
    }

    append(line);

    const marker = line.match(/^\s*(`{3,})(.*)$/);
    if (marker) fence = fence ? null : marker[1] + marker[2];
  }

  if (current.length) chunks.push(current.join("\n"));
  return chunks;
}

async function loadState() {
  try {
    const text = await readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(text);
    if (!parsed.sections || typeof parsed.sections !== "object") throw new Error("ungültig");
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") {
      return { version: 1, sections: {} };
    }
    throw new Error(`${STATE_FILE} ist keine gültige Sync-Datei: ${error.message}`);
  }
}

async function saveState(state) {
  if (DRY_RUN) return;
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  state.updatedAt = new Date().toISOString();
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function discord(method, url, body) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;

    try {
      response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const wait = Math.ceil((data.retry_after ?? 1) * 1000);
      console.warn(`Rate limit erreicht – warte ${wait} ms`);
      await sleep(wait);
      continue;
    }

    if (response.status >= 500) {
      if (attempt === 4) {
        throw new Error(`${method} → HTTP ${response.status} (Discord nicht erreichbar)`);
      }
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`${method} → HTTP ${response.status}: ${details.slice(0, 300)}`);
    }

    return response.status === 204 ? null : response.json();
  }

  throw new Error("Discord-Rate-Limit: zu viele Versuche");
}

async function checkWebhook() {
  if (DRY_RUN) return;

  try {
    await discord("GET", WEBHOOK);
  } catch (error) {
    throw new Error(
      "Der Discord-Webhook ist nicht erreichbar. Wurde er gelöscht, der Channel " +
        `entfernt oder das Secret ersetzt? (${error.message})`,
    );
  }
}

async function postMessage(content) {
  if (DRY_RUN) {
    console.log(`  [dry-run] neue Nachricht: ${content.split("\n")[0]}`);
    return { id: `dry-${Math.random().toString(36).slice(2)}` };
  }

  const url = new URL(WEBHOOK);
  url.searchParams.set("wait", "true");
  return discord("POST", url.toString(), {
    content,
    allowed_mentions: { parse: [] },
  });
}

async function editMessage(messageId, content) {
  if (DRY_RUN) {
    console.log(`  [dry-run] bearbeite ${messageId}: ${content.split("\n")[0]}`);
    return true;
  }
  if (messageId.startsWith("dry-")) return true;

  try {
    await discord("PATCH", `${WEBHOOK}/messages/${messageId}`, {
      content,
      allowed_mentions: { parse: [] },
    });
    return true;
  } catch (error) {
    if (error.message.includes("HTTP 404")) {
      console.warn(`  Nachricht ${messageId} existiert nicht mehr – wird neu gepostet.`);
      return false;
    }
    throw error;
  }
}

async function deleteMessage(messageId) {
  if (DRY_RUN) {
    console.log(`  [dry-run] lösche ${messageId}`);
    return;
  }
  if (messageId.startsWith("dry-")) return;

  try {
    await discord("DELETE", `${WEBHOOK}/messages/${messageId}`);
  } catch (error) {
    if (error.message.includes("HTTP 404")) return; // schon gelöscht
    throw error;
  }
}

async function main() {
  if (!DRY_RUN && !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(WEBHOOK)) {
    throw new Error(
      "DISCORD_WEBHOOK_URL fehlt oder ist keine gültige Discord-Webhook-URL.",
    );
  }

  await checkWebhook();

  const markdown = await readFile(FILE, "utf8");
  const sections = parseSections(markdown);
  if (sections.length === 0) {
    throw new Error(`Keine Abschnitte in ${FILE} gefunden.`);
  }

  const state = await loadState();
  const currentIds = new Set(sections.map((section) => section.id));
  let changes = 0;

  // Entfernte Abschnitte aus Discord löschen
  for (const [id, entry] of Object.entries(state.sections)) {
    if (currentIds.has(id)) continue;

    console.log(`- entfernt: ${id}`);
    for (const messageId of entry.messages ?? []) {
      await deleteMessage(messageId);
      await sleep(DELAY_MS);
    }
    delete state.sections[id];
    changes += 1;
    await saveState(state);
  }

  // Neue und geänderte Abschnitte schreiben
  for (const section of sections) {
    const hash = sha256(section.body);
    const entry = state.sections[section.id];

    if (entry?.hash === hash && !FORCE) continue;

    const chunks = splitText(section.body, MESSAGE_LIMIT);
    const existing = entry?.messages ?? [];
    const messages = [];

    console.log(
      `${entry ? "~" : "+"} ${section.id} (${chunks.length} Nachricht${chunks.length === 1 ? "" : "en"})`,
    );

    for (let i = 0; i < chunks.length; i += 1) {
      if (existing[i]) {
        const edited = await editMessage(existing[i], chunks[i]);
        if (edited) {
          messages.push(existing[i]);
        } else {
          const message = await postMessage(chunks[i]);
          messages.push(message.id);
        }
      } else {
        const message = await postMessage(chunks[i]);
        if (!DRY_RUN) console.log(`  + Nachricht ${message.id}`);
        messages.push(message.id);
      }
      await sleep(DELAY_MS);
    }

    // Überzählige Nachrichten löschen, wenn ein Abschnitt kürzer wird
    for (let i = chunks.length; i < existing.length; i += 1) {
      await deleteMessage(existing[i]);
      await sleep(DELAY_MS);
    }

    state.sections[section.id] = { hash, messages };
    changes += 1;
    await saveState(state);
  }

  console.log(changes === 0 ? "Keine Änderungen." : `Fertig: ${changes} Änderung(en).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Fehler: ${error.message}`);
    process.exitCode = 1;
  });
}

export { parseSections, splitText, slugify };
