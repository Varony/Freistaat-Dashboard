import { readFile } from "node:fs/promises";

export const DOCUMENTS = JSON.parse(
  await readFile(new URL("../law-documents.json", import.meta.url), "utf8"),
);

const PATTERNS = {
  // Verfassung: Kapitel und Artikel (##, ###, ####)
  headings: /^(?=#{2,4}\s+)/m,
  // Recht und Ordnung: jeder Paragraph (§)
  paragraphs: /^(?=#{1,2}\s+§)/m,
  // Einstweilige Verfügungen: jede numerierte Verfügung
  numbered: /^(?=\d+\.\s+)/m,
};

export function splitDocument(text, document) {
  const pattern = PATTERNS[document.kind];
  if (!pattern) throw new Error(`Unbekannter Dokumenttyp: ${document.kind}`);

  const normalized = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  return normalized
    .split(pattern)
    .map((unit) => unit.trim())
    .filter(Boolean);
}

/** Discord kennt nur Überschriften bis H3. */
export function normalizeForDiscord(text) {
  return String(text ?? "").replace(/^(#{4,6})\s+/gm, "### ");
}

/** Teilt lange Gesetzestexte an Zeilengrenzen in Discord-Nachrichten. */
export function chunkForDiscord(text, limit = 1900) {
  const source = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) return [];
  if (source.length <= limit) return [source];

  const chunks = [];
  let current = "";

  for (const line of source.split("\n")) {
    if (line.length > limit) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let offset = 0; offset < line.length; offset += limit) {
        chunks.push(line.slice(offset, offset + limit));
      }
      continue;
    }

    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > limit) {
      chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
