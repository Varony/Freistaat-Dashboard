import { statSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { OpenCode } from "@opencode/client"
import { Service } from "@opencode/client/service"
import { config, ROOT } from "./config.js"

const MODEL_CACHE_MS = 60_000

export class OpenCodeConnection {
  constructor(client, endpoint, version) {
    this.client = client
    this.endpoint = endpoint
    this.version = version
    this.modelCache = new Map()
  }
}

export async function connectOpenCode() {
  let baseUrl = config.opencode.url
  let headers = {}

  if (baseUrl) {
    if (config.opencode.token) {
      headers.authorization = `Bearer ${config.opencode.token}`
    } else if (config.opencode.auth) {
      const separator = config.opencode.auth.indexOf(":")
      const username = separator === -1 ? config.opencode.auth : config.opencode.auth.slice(0, separator)
      const password = separator === -1 ? "" : config.opencode.auth.slice(separator + 1)
      headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
    }
  } else {
    // Discovers the shared background service and starts it when necessary.
    const endpoint = await Service.ensure()
    baseUrl = endpoint.url
    headers = Service.headers(endpoint)
  }

  const client = OpenCode.make({ baseUrl, headers })
  const info = await client.server.info()

  return new OpenCodeConnection(client, { url: baseUrl, version: info.version }, info.version)
}

/**
 * Subscribes to the live event stream. The stream is live-only, so a broken
 * connection is re-established after a short delay.
 */
export function startEventStream(connection, onEvent) {
  let stopped = false

  const loop = async () => {
    while (!stopped) {
      try {
        for await (const event of connection.client.event.subscribe()) {
          if (stopped) return
          try {
            onEvent(event)
          } catch (error) {
            console.error("[events] Handler-Fehler:", error)
          }
        }
        if (!stopped) console.warn("[events] Stream beendet, verbinde neu …")
      } catch (error) {
        if (!stopped) {
          console.warn(`[events] Verbindung verloren (${error?.message ?? error}), verbinde neu …`)
        }
      }

      if (!stopped) await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }

  loop().catch((error) => console.error("[events] Stream beendet:", error))

  return () => {
    stopped = true
  }
}

export function resolveDirectory(input) {
  if (!input) return config.opencode.directory
  let value = input.trim()
  if (value === "~") value = process.env.HOME ?? value
  else if (value.startsWith("~/")) value = resolve(process.env.HOME ?? "", value.slice(2))
  if (!isAbsolute(value)) value = resolve(ROOT, value)

  try {
    if (!statSync(value).isDirectory()) throw new Error("kein Verzeichnis")
  } catch {
    throw new Error(`Verzeichnis nicht gefunden: ${value}`)
  }
  return value
}

export function parseModelRef(value) {
  if (!value) return undefined
  const trimmed = value.trim()
  const hash = trimmed.indexOf("#")
  const variant = hash === -1 ? undefined : trimmed.slice(hash + 1)
  const base = hash === -1 ? trimmed : trimmed.slice(0, hash)
  const slash = base.indexOf("/")
  if (slash === -1) return { modelID: base, providerID: undefined, variant }
  return {
    providerID: base.slice(0, slash),
    modelID: base.slice(slash + 1),
    variant,
  }
}

export function modelKey(model) {
  if (!model) return "Standard"
  const variant = model.variant && model.variant !== "default" ? `#${model.variant}` : ""
  return `${model.providerID}/${model.id ?? model.modelID}${variant}`
}

/** Drops OpenCode's implicit "default" variant from stored references. */
export function normalizeModel(model) {
  if (!model) return null
  const id = model.id ?? model.modelID
  const providerID = model.providerID
  if (!id || !providerID) return model
  return {
    providerID,
    id,
    ...(model.variant && model.variant !== "default" ? { variant: model.variant } : {}),
  }
}

export async function listModels(connection, directory, { refresh = false } = {}) {
  const key = directory
  const cached = connection.modelCache.get(key)
  if (!refresh && cached && Date.now() - cached.at < MODEL_CACHE_MS) return cached.models

  const response = await connection.client.model.list({ location: { directory } })
  const models = response.data.filter((model) => model.enabled && model.status !== "deprecated")
  connection.modelCache.set(key, { at: Date.now(), models })
  return models
}

/** Accepts "provider/model", a bare model ID, or a display name. */
export async function resolveModel(connection, directory, value) {
  if (!value) return undefined
  const parsed = parseModelRef(value)

  if (parsed.providerID) {
    return { providerID: parsed.providerID, id: parsed.modelID, variant: parsed.variant }
  }

  const models = await listModels(connection, directory)
  const query = parsed.modelID.toLowerCase()
  const matches = models.filter(
    (model) =>
      model.modelID.toLowerCase() === query ||
      model.id.toLowerCase() === query ||
      model.name.toLowerCase() === query,
  )

  if (matches.length === 1) {
    return { providerID: matches[0].providerID, id: matches[0].modelID, variant: parsed.variant }
  }
  if (matches.length === 0) throw new Error(`Modell nicht gefunden: ${value}`)
  throw new Error(
    `Modell "${value}" ist mehrdeutig. Bitte provider/model angeben: ${matches
      .slice(0, 5)
      .map((model) => modelKey(model))
      .join(", ")}`,
  )
}

export async function listAgents(connection, directory) {
  const response = await connection.client.agent.list({ location: { directory } })
  return response.data.filter((agent) => !agent.hidden && agent.mode !== "subagent")
}

export async function ensureSession(connection, store, channelID, options) {
  const existing = store.get(channelID)
  const directory = options.directory

  if (existing && existing.directory === directory) {
    try {
      const info = await connection.client.session.get({ sessionID: existing.sessionID })
      if (info.location?.directory === directory) {
        return { info, created: false, record: existing }
      }
    } catch {
      // Session was deleted or belongs to another server: create a fresh one.
    }
  }

  const agent = options.agent ?? existing?.agent
  const model = options.model ?? existing?.model
  const info = await connection.client.session.create({
    title: options.title,
    location: { directory },
    ...(agent ? { agent } : {}),
    ...(model ? { model } : {}),
  })

  const record = store.set(channelID, {
    sessionID: info.id,
    directory,
    agent: info.agent ?? agent ?? null,
    model: normalizeModel(info.model ?? model),
    title: info.title ?? options.title,
  })

  return { info, created: true, record }
}

export async function switchModel(connection, store, channelID, model) {
  const record = store.get(channelID)
  if (!record) throw new Error("Noch keine Session. Nutze zuerst /ask oder /new.")
  await connection.client.session.switchModel({ sessionID: record.sessionID, model })
  store.patch(channelID, { model: normalizeModel(model) })
}

export async function switchAgent(connection, store, channelID, agent) {
  const record = store.get(channelID)
  if (!record) throw new Error("Noch keine Session. Nutze zuerst /ask oder /new.")
  await connection.client.session.switchAgent({ sessionID: record.sessionID, agent })
  store.patch(channelID, { agent })
}
