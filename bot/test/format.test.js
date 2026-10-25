import assert from "node:assert/strict"
import test from "node:test"
import { escapeMentions, formatCost, formatDuration, splitMessage, truncate } from "../src/format.js"
import { modelKey, parseModelRef } from "../src/opencode.js"

test("splitMessage keeps every chunk below the limit", () => {
  const text = Array.from({ length: 300 }, (_, index) => `Zeile ${index}: ${"x".repeat(40)}`).join("\n")
  const chunks = splitMessage(text, 500)
  assert.ok(chunks.length > 1)
  for (const chunk of chunks) assert.ok(chunk.length <= 500, `chunk too long: ${chunk.length}`)
  assert.equal(chunks.join("\n").replace(/\n+/g, "\n"), text.replace(/\n+/g, "\n"))
})

test("splitMessage balances code fences across messages", () => {
  const text = `Intro\n\n\`\`\`js\n${Array.from({ length: 40 }, (_, i) => `const x${i} = ${i}`).join("\n")}\n\`\`\`\nEnde`
  const chunks = splitMessage(text, 200)
  for (const chunk of chunks) {
    const fences = chunk.split("\n").filter((line) => line.trimStart().startsWith("```")).length
    assert.equal(fences % 2, 0, `unbalanced fence in chunk:\n${chunk}`)
  }
})

test("splitMessage handles empty input", () => {
  assert.deepEqual(splitMessage(""), [])
  assert.deepEqual(splitMessage(null), [])
})

test("escapeMentions defuses everyone and here", () => {
  assert.equal(escapeMentions("@everyone @here"), "@\u200beveryone @\u200bhere")
})

test("format helpers", () => {
  assert.equal(truncate("abcdef", 5), "abcd…")
  assert.equal(formatDuration(65_000), "1m 5s")
  assert.equal(formatCost(0), "0 $")
})

test("parseModelRef understands provider/model#variant", () => {
  assert.deepEqual(parseModelRef("deepseek/deepseek-flash"), {
    providerID: "deepseek",
    modelID: "deepseek-flash",
    variant: undefined,
  })
  assert.deepEqual(parseModelRef("opencode/flint#fast"), {
    providerID: "opencode",
    modelID: "flint",
    variant: "fast",
  })
  assert.deepEqual(parseModelRef("flint"), {
    providerID: undefined,
    modelID: "flint",
    variant: undefined,
  })
})

test("modelKey formats model references", () => {
  assert.equal(modelKey({ providerID: "deepseek", id: "deepseek-flash" }), "deepseek/deepseek-flash")
  assert.equal(modelKey(null), "Standard")
})
