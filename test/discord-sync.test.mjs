import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMarkdown,
  isLawMessage,
  messageText,
  splitTitle,
} from "../scripts/sync-from-discord.mjs";

const baseMessage = {
  author: { bot: false },
  type: 0,
  attachments: [],
};

test("splitTitle nutzt eine Markdown-Überschrift als Titel", () => {
  const result = splitTitle("# § 1 Keine Strafe ohne Gesetz\n\nEine Tat kann nur bestraft werden.", {
    timestamp: "2026-10-20T12:00:00.000Z",
  });

  assert.equal(result.title, "§ 1 Keine Strafe ohne Gesetz");
  assert.equal(result.body, "Eine Tat kann nur bestraft werden.");
});

test("splitTitle nutzt eine kurze erste Zeile als Titel", () => {
  const result = splitTitle("§ 2 Ort der Tat\n\nEine Tat ist an jedem Ort begangen.", {
    timestamp: "2026-10-20T12:00:00.000Z",
  });

  assert.equal(result.title, "§ 2 Ort der Tat");
  assert.equal(result.body, "Eine Tat ist an jedem Ort begangen.");
});

test("splitTitle fällt auf ein Datum zurück, wenn es keinen Titel gibt", () => {
  const result = splitTitle("Nur ein einzelner langer Absatz ohne Überschrift.", {
    timestamp: "2026-10-20T12:00:00.000Z",
  });

  assert.match(result.title, /^Gesetz vom /);
  assert.equal(result.body, "Nur ein einzelner langer Absatz ohne Überschrift.");
});

test("splitTitle stuft interne ##-Überschriften herunter", () => {
  const result = splitTitle("§ 3 Personenbegriffe\n\n## Definition\n\nText", {
    timestamp: "2026-10-20T12:00:00.000Z",
  });

  assert.equal(result.title, "§ 3 Personenbegriffe");
  assert.match(result.body, /^### Definition$/m);
});

test("messageText hängt Anhänge als Links an", () => {
  const text = messageText({
    content: "Gesetzestext",
    attachments: [{ filename: "anlage.pdf", url: "https://cdn.example/anlage.pdf" }],
  });

  assert.equal(text, "Gesetzestext\n[anlage.pdf](https://cdn.example/anlage.pdf)");
});

test("messageText nutzt den Inhalt eines geladenen Markdown-Anhangs", () => {
  const text = messageText({
    content: "# Verfassung des Freistaates",
    attachments: [
      {
        filename: "Verfassung des Freistaates.md",
        content: "Präambel\n\n## Artikel",
      },
    ],
  });

  assert.equal(text, "# Verfassung des Freistaates\nPräambel\n\n## Artikel");
});

test("isLawMessage ignoriert Bots, Webhooks und Systemnachrichten", () => {
  assert.equal(isLawMessage({ ...baseMessage, content: "Text" }), true);
  assert.equal(isLawMessage({ ...baseMessage, content: "Text", author: { bot: true } }), false);
  assert.equal(isLawMessage({ ...baseMessage, content: "Text", webhook_id: "123" }), false);
  assert.equal(isLawMessage({ ...baseMessage, content: "Text", type: 6 }), false);
  assert.equal(isLawMessage({ ...baseMessage, content: "   " }), false);
});

test("isLawMessage akzeptiert Bot-Nachrichten mit Markdown-Anhang", () => {
  assert.equal(
    isLawMessage({
      ...baseMessage,
      author: { bot: true },
      content: "# Verfassung",
      attachments: [{ filename: "Verfassung.md", url: "https://cdn.example/Verfassung.md" }],
    }),
    true,
  );
});

test("buildMarkdown erzeugt die Struktur, die lib/laws.ts erwartet", () => {
  const messages = [
    {
      ...baseMessage,
      id: "111111111111111111",
      timestamp: "2026-10-20T12:00:00.000Z",
      content: "# § 1 Keine Strafe ohne Gesetz\n\nEine Tat kann nur bestraft werden.",
    },
    {
      ...baseMessage,
      id: "222222222222222222",
      timestamp: "2026-10-21T12:00:00.000Z",
      content: "§ 2 Ort der Tat\n\n## Absatz\n\nEine Tat ist an jedem Ort begangen.",
    },
  ];

  const markdown = buildMarkdown(messages, {
    id: "999999999999999999",
    name: "gesetzbuch",
    guildID: "888888888888888888",
  });

  assert.match(markdown, /^# Gesetzblatt des Freistaats$/m);
  assert.match(markdown, /^## § 1 Keine Strafe ohne Gesetz$/m);
  assert.match(markdown, /^## § 2 Ort der Tat$/m);
  assert.match(markdown, /<!-- discord:111111111111111111 -->/);
  assert.match(markdown, /<!-- passed:2026-10-20T12:00:00.000Z -->/);
  assert.match(
    markdown,
    /https:\/\/discord\.com\/channels\/888888888888888888\/999999999999999999\/111111111111111111/,
  );
  assert.match(markdown, /<!-- discord-channel:999999999999999999 -->/);
  assert.match(markdown, /<!-- discord-channel-name:gesetzbuch -->/);

  const sections = markdown.split(/^##\s+/m).slice(1);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].split("\n")[0].trim(), "§ 1 Keine Strafe ohne Gesetz");
  assert.equal(sections[1].split("\n")[0].trim(), "§ 2 Ort der Tat");
  assert.match(sections[1], /^### Absatz$/m);
});

test("buildMarkdown übernimmt den Inhalt eines Markdown-Anhangs", () => {
  const markdown = buildMarkdown(
    [
      {
        ...baseMessage,
        id: "333333333333333333",
        timestamp: "2026-10-22T12:00:00.000Z",
        content: "# Verfassung des Freistaates",
        attachments: [
          {
            filename: "Verfassung des Freistaates.md",
            content: "Präambel\n\n## Artikel",
          },
        ],
      },
    ],
    { id: "999999999999999999", name: "gesetzbuch", guildID: "888888888888888888" },
  );

  assert.match(markdown, /^## Verfassung des Freistaates$/m);
  assert.match(markdown, /Präambel\n\n### Artikel/);
});
