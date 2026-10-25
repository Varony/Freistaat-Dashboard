const DEFAULT_LIMIT = 1900

/**
 * Splits text into Discord-sized chunks. Prefers line breaks and keeps fenced
 * code blocks balanced, so a code sample that spans messages stays readable.
 */
export function splitMessage(text, limit = DEFAULT_LIMIT) {
  const source = String(text ?? "").replace(/\r\n/g, "\n").trim()
  if (!source) return []

  const raw = []
  let current = ""

  const flush = () => {
    if (current) raw.push(current)
    current = ""
  }

  for (const line of source.split("\n")) {
    if (line.length > limit) {
      flush()
      for (let offset = 0; offset < line.length; offset += limit) {
        raw.push(line.slice(offset, offset + limit))
      }
      continue
    }
    const candidate = current ? `${current}\n${line}` : line
    if (candidate.length > limit) {
      flush()
      current = line
    } else {
      current = candidate
    }
  }
  flush()

  const chunks = []
  let openFence = null

  for (const chunk of raw) {
    let body = openFence ? `${openFence}\n${chunk}` : chunk
    let fence = openFence

    for (const line of chunk.split("\n")) {
      const match = line.match(/^\s*(```+.*)$/)
      if (match) fence = fence ? null : line.trim()
    }

    if (fence) body = `${body}\n\`\`\``
    chunks.push(body)
    openFence = fence
  }

  return chunks
}

/** Prevents model output from pinging everyone on the server. */
export function escapeMentions(text) {
  return String(text ?? "").replace(/@(everyone|here)\b/gi, "@\u200b$1")
}

export function truncate(text, max) {
  const value = String(text ?? "")
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`
}

export function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(Number(value) || 0)
}

export function formatCost(value) {
  const cost = Number(value) || 0
  if (cost === 0) return "0 $"
  if (cost < 0.01) return `${cost.toFixed(4)} $`
  return `${cost.toFixed(2)} $`
}

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return `${minutes}m ${rest}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function formatTokens(tokens) {
  if (!tokens) return null
  const total = (tokens.input ?? 0) + (tokens.output ?? 0) + (tokens.reasoning ?? 0)
  return `${formatNumber(total)} Tokens`
}

/** One-line description of a tool call for the live view. */
export function describeTool(tool) {
  const input = tool.input ?? {}
  const hint =
    input.command ??
    input.filePath ??
    input.path ??
    input.pattern ??
    input.query ??
    input.url ??
    input.description ??
    input.prompt ??
    ""

  const clean = truncate(String(Array.isArray(hint) ? hint.join(" ") : hint).replace(/\s+/g, " "), 110)
  return clean ? `\`${tool.name}\` · ${clean.replaceAll("`", "ˋ")}` : `\`${tool.name}\``
}

/** Best-effort readable error, including OpenCode's structured errors. */
export function formatError(error) {
  if (!error) return "Unbekannter Fehler"
  if (typeof error === "string") return error
  if (typeof error.message === "string" && error.message) return error.message
  if (typeof error._tag === "string") return `${error._tag}: ${error.message ?? "ohne Details"}`
  try {
    return truncate(JSON.stringify(error), 500)
  } catch {
    return String(error)
  }
}

/** Short summary of an OpenCode session for lists. */
export function sessionLabel(info, isCurrent = false) {
  const title = info.title?.trim() || "Ohne Titel"
  return `${isCurrent ? "▶ " : "• "}**${truncate(title, 60)}** · \`${info.id}\``
}
