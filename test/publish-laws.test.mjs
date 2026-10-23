import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFilename } from "../scripts/publish-laws.mjs";

test("normalizeFilename gleicht Discord-Sanitizing aus", () => {
  assert.equal(
    normalizeFilename("Einstweilige Verfügungen.md"),
    normalizeFilename("Einstweilige_Verfugungen.md"),
  );
  assert.equal(
    normalizeFilename("Verfassung des Freistaates.md"),
    normalizeFilename("Verfassung_des_Freistaates.md"),
  );
  assert.equal(
    normalizeFilename("Recht und Ordnung.md"),
    normalizeFilename("Recht_und_Ordnung.md"),
  );
});
