import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkForDiscord,
  normalizeForDiscord,
  splitDocument,
} from "../scripts/law-documents.mjs";

test("splitDocument teilt Paragraphen", () => {
  const units = splitDocument("# § 1 A\nText\n\n# § 2 B\nText", { kind: "paragraphs" });
  assert.equal(units.length, 2);
  assert.match(units[0], /^# § 1/);
  assert.match(units[1], /^# § 2/);
});

test("splitDocument teilt numerierte Verfügungen", () => {
  const units = splitDocument("1. A\n2. B\n3. C", { kind: "numbered" });
  assert.deepEqual(units, ["1. A", "2. B", "3. C"]);
});

test("splitDocument teilt Kapitel und Artikel", () => {
  const units = splitDocument("Präambel\n## Kapitel\n#### Art 1\nText", { kind: "headings" });
  assert.equal(units.length, 3);
  assert.equal(units[0], "Präambel");
  assert.equal(units[1], "## Kapitel");
  assert.match(units[2], /^#### Art 1/);
});

test("normalizeForDiscord macht aus H4 H3", () => {
  assert.equal(normalizeForDiscord("#### Art 1\nText"), "### Art 1\nText");
  assert.equal(normalizeForDiscord("### Art 1"), "### Art 1");
});

test("chunkForDiscord hält Nachrichten unter dem Limit", () => {
  const text = Array.from({ length: 50 }, (_, index) => `Zeile ${index} ${"x".repeat(50)}`).join("\n");
  const chunks = chunkForDiscord(text, 200);
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) assert.ok(chunk.length <= 200);
});
