import { existsSync } from "node:fs"
import { resolve } from "node:path"

export const ROOT = resolve(import.meta.dirname, "..")

// Load .env next to package.json, independent of the current working directory.
const envFile = resolve(ROOT, ".env")
if (existsSync(envFile)) process.loadEnvFile(envFile)

function text(name) {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function number(name, fallback) {
  const value = Number(text(name))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function list(name) {
  return (text(name) ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function directory(name, fallback) {
  const value = text(name)
  if (!value) return fallback
  if (value === "~") return process.env.HOME ?? fallback
  if (value.startsWith("~/")) return resolve(process.env.HOME ?? "", value.slice(2))
  return resolve(ROOT, value)
}

export const config = {
  discord: {
    token: text("DISCORD_TOKEN"),
    clientID: text("DISCORD_CLIENT_ID"),
    guildID: text("DISCORD_GUILD_ID"),
    allowedUsers: list("DISCORD_ALLOWED_USERS"),
    allowedChannels: list("DISCORD_ALLOWED_CHANNELS"),
  },
  opencode: {
    // Leave OPENCODE_URL empty to use the local background service (recommended).
    url: text("OPENCODE_URL"),
    // Only needed for a remote server. OPENCODE_AUTH is "user:password".
    auth: text("OPENCODE_AUTH"),
    token: text("OPENCODE_TOKEN"),
    directory: directory("OPENCODE_DIRECTORY", ROOT),
    agent: text("OPENCODE_AGENT"),
    // Format: provider/model, e.g. "deepseek/deepseek-flash"
    model: text("OPENCODE_MODEL"),
    requestTimeoutMs: number("OPENCODE_TIMEOUT_MS", 30 * 60 * 1000),
  },
  ui: {
    // Discord allows roughly five edits per five seconds and channel.
    streamUpdateMs: number("STREAM_UPDATE_MS", 1500),
    // Show streamed text live. Disable for very quiet channels.
    stream: text("STREAM_OUTPUT") !== "false",
  },
  dataFile: resolve(ROOT, text("STATE_FILE") ?? ".data/state.json"),
}

export function requireDiscordToken() {
  if (!config.discord.token) {
    throw new Error(
      "DISCORD_TOKEN fehlt. Kopiere .env.example nach .env und trage den Bot-Token ein.",
    )
  }
  return config.discord.token
}
