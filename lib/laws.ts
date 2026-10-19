import { readFile } from "node:fs/promises";
import path from "node:path";
import { mockLaws } from "./mock-data";
import type { Law } from "./types";

/**
 * Liest das Gesetzblatt aus content/Gesetze.md.
 * Solange die Datei leer ist (Bot noch nicht aktiv), werden Beispieldaten genutzt.
 */
export async function getLaws(): Promise<Law[]> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "content", "Gesetze.md"),
      "utf8",
    );

    const cleaned = file.replace(/<!--[\s\S]*?-->/g, "").trim();
    const sections = cleaned.split(/^##\s+/m).slice(1);

    const laws = sections
      .map((section, index) => {
        const [firstLine, ...rest] = section.split("\n");
        const title = firstLine.trim();
        const body = rest
          .join("\n")
          .replace(/^---$/gm, "")
          .trim();

        return { id: `abschnitt-${index + 1}`, title, body };
      })
      .filter((law) => law.title.length > 0);

    if (laws.length > 0) return laws;
  } catch {
    // Datei fehlt oder ist nicht lesbar → Beispieldaten
  }

  return mockLaws;
}
