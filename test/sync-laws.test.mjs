import assert from "node:assert/strict";
import test from "node:test";
import { buildDocumentFile, isUsableMessage } from "../scripts/sync-laws-from-discord.mjs";

test("buildDocumentFile sortiert und trennt Nachrichten", () => {
  const file = buildDocumentFile(
    { separator: "\n\n" },
    { id: "123456789012345678", name: "test-channel" },
    [
      { id: "2", content: "Zweites Gesetz" },
      { id: "1", content: "Erstes Gesetz" },
    ],
    "999999999999999999",
  );

  assert.match(file, /<!-- discord-channel:123456789012345678 -->/);
  assert.match(
    file,
    /https:\/\/discord\.com\/channels\/999999999999999999\/123456789012345678/,
  );
  assert.ok(file.indexOf("Erstes Gesetz") < file.indexOf("Zweites Gesetz"));
  assert.match(file, /Erstes Gesetz\n\nZweites Gesetz/);
});

test("isUsableMessage filtert Systeme, Webhooks und leere Nachrichten", () => {
  assert.equal(isUsableMessage({ type: 0, content: "Text" }), true);
  assert.equal(isUsableMessage({ type: 7, content: "System" }), false);
  assert.equal(isUsableMessage({ type: 0, content: "Text", webhook_id: "1" }), false);
  assert.equal(isUsableMessage({ type: 0, content: "   " }), false);
});
