import { readFile } from "node:fs/promises";
import path from "node:path";
import { mockLaws } from "./mock-data";
import type { Law } from "./types";

export type LawBook = {
  laws: Law[];
  syncedFromDiscord: boolean;
  channelID?: string;
  guildID?: string;
  channelName?: string;
  sourceUrl?: string;
};

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
    syncedFromDiscord: Boolean(channelID),
    channelID,
    guildID,
    channelName,
    sourceUrl,
  };
}

/**
 * Liest das Gesetzblatt aus content/Gesetze.md.
 * Solange die Datei fehlt oder leer ist, werden Beispieldaten genutzt.
 */
export async function getLawBook(): Promise<LawBook> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "content", "Gesetze.md"),
      "utf8",
    );

    const book = parseLawBook(file);
    if (book.laws.length > 0) return book;
  } catch {
    // Datei fehlt oder ist nicht lesbar → Beispieldaten
  }

  return { laws: mockLaws, syncedFromDiscord: false };
}

export async function getLaws(): Promise<Law[]> {
  return (await getLawBook()).laws;
}
