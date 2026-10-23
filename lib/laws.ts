import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { mockLaws } from "./mock-data";
import type { Law } from "./types";

export type LawBook = {
  laws: Law[];
  origin: "discord" | "files" | "mock";
  syncedFromDiscord: boolean;
  channelID?: string;
  guildID?: string;
  channelName?: string;
  sourceUrl?: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const GENERATED_FILE = "Gesetze.md";
const MANUAL_ORDER = [
  "Verfassung des Freistaates",
  "Recht und Ordnung",
  "Einstweilige Verfügungen",
];

const MESSAGE_MARKER = /<!--\s*discord:(\d+)\s*-->/;
const PASSED_MARKER = /<!--\s*passed:([^\s]+)\s*-->/;
const SOURCE_LINK = /^\[Im Discord ansehen\]\((https?:\/\/[^)\s]+)\)\s*$/m;

function marker(markdown: string, name: string): string | undefined {
  const match = markdown.match(new RegExp(`<!--\\s*${name}:([^>]*?)\\s*-->`));
  return match?.[1]?.trim() || undefined;
}

/**
 * Parst das von scripts/sync-from-discord.mjs erzeugte Gesetzblatt.
 *
 * Jedes Gesetz ist ein "## Titel"-Abschnitt. Versteckte Marker enthalten die
 * Discord-Nachrichten-ID und den Beschlusszeitpunkt; der sichtbare Link am
 * Ende führt zurück in den Channel.
 */
export function parseLawBook(markdown: string): LawBook {
  const channelID = marker(markdown, "discord-channel");
  const guildID = marker(markdown, "discord-guild");
  const channelName = marker(markdown, "discord-channel-name");
  const channelURL = marker(markdown, "discord-channel-url");

  const sourceUrl =
    channelURL ??
    (channelID && guildID
      ? `https://discord.com/channels/${guildID}/${channelID}`
      : undefined);

  const normalized = markdown.replace(/\r\n/g, "\n");
  const sections = normalized.split(/^##\s+/m).slice(1);

  const laws = sections
    .map((section, index) => {
      const [firstLine, ...rest] = section.split("\n");
      const title = firstLine.trim();
      const sectionBody = rest.join("\n");

      const messageID = sectionBody.match(MESSAGE_MARKER)?.[1];
      const passedAt = sectionBody.match(PASSED_MARKER)?.[1];
      const lawSource =
        sectionBody.match(SOURCE_LINK)?.[1] ??
        (messageID && channelID && guildID
          ? `https://discord.com/channels/${guildID}/${channelID}/${messageID}`
          : undefined);

      const body = sectionBody
        .replace(MESSAGE_MARKER, "")
        .replace(PASSED_MARKER, "")
        .replace(SOURCE_LINK, "")
        .replace(/^---$/gm, "")
        .trim();

      const law: Law = {
        id: messageID ? `gesetz-${messageID}` : `abschnitt-${index + 1}`,
        title,
        body,
      };
      if (passedAt) law.passedAt = passedAt;
      if (lawSource) law.sourceUrl = lawSource;

      return law;
    })
    .filter((law) => law.title.length > 0);

  return {
    laws,
    origin: channelID ? "discord" : "files",
    syncedFromDiscord: Boolean(channelID),
    channelID,
    guildID,
    channelName,
    sourceUrl,
  };
}

function titleFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
}

function idFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Liest die manuell gepflegten Gesetzestexte aus content/*.md.
 * Gesetze.md ist reserviert für den Discord-Sync.
 */
async function readManualLaws(): Promise<Law[]> {
  let entries;
  try {
    entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".md") &&
        entry.name !== GENERATED_FILE,
    )
    .map((entry) => entry.name);

  const laws = await Promise.all(
    files.map(async (filename): Promise<Law | null> => {
      const body = (await readFile(path.join(CONTENT_DIR, filename), "utf8")).trim();
      if (!body) return null;

      return {
        id: idFromFilename(filename),
        title: titleFromFilename(filename),
        body,
      };
    }),
  );

  return laws
    .filter((law): law is Law => law !== null)
    .sort((a, b) => {
      const indexA = MANUAL_ORDER.indexOf(a.title);
      const indexB = MANUAL_ORDER.indexOf(b.title);
      if (indexA !== -1 || indexB !== -1) {
        return (indexA === -1 ? MANUAL_ORDER.length : indexA) -
          (indexB === -1 ? MANUAL_ORDER.length : indexB);
      }
      return a.title.localeCompare(b.title, "de");
    });
}

/**
 * Bevorzugt das aus Discord erzeugte Gesetzblatt. Solange es fehlt, werden die
 * drei manuell gepflegten Texte aus content/ verwendet.
 */
export async function getLawBook(): Promise<LawBook> {
  try {
    const file = await readFile(path.join(CONTENT_DIR, GENERATED_FILE), "utf8");
    const book = parseLawBook(file);
    if (book.laws.length > 0) return book;
  } catch {
    // Noch kein Sync vorhanden → manuelle Texte
  }

  const manual = await readManualLaws();
  if (manual.length > 0) {
    return { laws: manual, origin: "files", syncedFromDiscord: false };
  }

  return { laws: mockLaws, origin: "mock", syncedFromDiscord: false };
}

export async function getLaws(): Promise<Law[]> {
  return (await getLawBook()).laws;
}
