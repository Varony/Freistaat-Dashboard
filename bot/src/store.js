import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

/**
 * Tiny JSON store. Maps a Discord channel (or thread) ID to its OpenCode session.
 * Writes are atomic so a crash cannot leave a half-written state file behind.
 */
export class Store {
  constructor(file) {
    this.file = file
    this.channels = {}
    this.#load()
  }

  #load() {
    try {
      const parsed = JSON.parse(readFileSync(this.file, "utf8"))
      if (parsed && typeof parsed.channels === "object" && parsed.channels !== null) {
        this.channels = parsed.channels
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn(`[state] Konnte ${this.file} nicht lesen: ${error.message}`)
      }
    }
  }

  #save() {
    mkdirSync(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    writeFileSync(tmp, `${JSON.stringify({ version: 1, channels: this.channels }, null, 2)}\n`)
    renameSync(tmp, this.file)
  }

  get(channelID) {
    return this.channels[channelID]
  }

  set(channelID, value) {
    this.channels[channelID] = { ...value, updated: Date.now() }
    this.#save()
    return this.channels[channelID]
  }

  patch(channelID, value) {
    const current = this.channels[channelID]
    if (!current) throw new Error(`Kein gespeicherter Zustand für Channel ${channelID}`)
    return this.set(channelID, { ...current, ...value })
  }

  delete(channelID) {
    delete this.channels[channelID]
    this.#save()
  }

  findChannelBySession(sessionID) {
    return Object.entries(this.channels).find(([, value]) => value.sessionID === sessionID)?.[0]
  }

  list() {
    return Object.entries(this.channels)
  }
}
