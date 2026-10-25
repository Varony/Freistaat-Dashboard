import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { config } from "./config.js"
import {
  describeTool,
  escapeMentions,
  formatCost,
  formatDuration,
  formatError,
  formatTokens,
  splitMessage,
  truncate,
} from "./format.js"

const MAX_TOOLS = 5
const TEXT_LIMIT = 1900

export class RunView {
  constructor({ connection, channel, message, sessionID, directory, prompt }) {
    this.connection = connection
    this.channel = channel
    this.message = message
    this.sessionID = sessionID
    this.directory = directory
    this.prompt = prompt

    this.startedAt = Date.now()
    this.agent = null
    this.model = null
    this.status = "Startet …"
    this.texts = new Map()
    this.textOrder = []
    this.tools = new Map()
    this.toolNames = new Map()
    this.steps = 0
    this.tokens = null
    this.cost = null

    this.finished = false
    this.dirty = false
    this.timer = null
    this.editPromise = null
    this.lastUpdate = 0

    this.done = new Promise((resolve) => {
      this.resolveDone = resolve
    })

    this.typing = setInterval(() => {
      this.channel.sendTyping?.().catch(() => {})
    }, 8_000)
    this.channel.sendTyping?.().catch(() => {})
  }

  get text() {
    return this.textOrder.map((key) => this.texts.get(key) ?? "").join("\n\n").trim()
  }

  start() {
    return this.#renderLive()
  }

  handleEvent(event) {
    if (this.finished) return
    const data = event.data ?? {}
    if (data.sessionID && data.sessionID !== this.sessionID) return

    switch (event.type) {
      case "session.step.started": {
        this.agent = data.agent ?? this.agent
        this.model = data.model ? `${data.model.providerID}/${data.model.id}` : this.model
        this.status = "Antwortet …"
        this.#schedule()
        break
      }
      case "session.reasoning.started": {
        this.status = "Denkt nach …"
        this.#schedule()
        break
      }
      case "session.text.started": {
        this.#ensureText(data)
        this.status = "Schreibt …"
        this.#schedule()
        break
      }
      case "session.text.delta": {
        const key = this.#ensureText(data)
        this.texts.set(key, (this.texts.get(key) ?? "") + (data.delta ?? ""))
        this.#schedule()
        break
      }
      case "session.text.ended": {
        const key = this.#ensureText(data)
        if (typeof data.text === "string") this.texts.set(key, data.text)
        this.#schedule()
        break
      }
      case "session.usage.updated": {
        this.cost = data.cost ?? this.cost
        this.tokens = data.tokens ?? this.tokens
        break
      }
      case "session.step.ended": {
        this.steps += 1
        this.cost = data.cost ?? this.cost
        this.tokens = data.tokens ?? this.tokens
        break
      }
      case "session.tool.input.started": {
        if (data.id && data.name) this.toolNames.set(data.id, data.name)
        break
      }
      case "session.tool.called": {
        this.tools.set(data.id, {
          id: data.id,
          name: this.toolNames.get(data.id) ?? "tool",
          input: data.input ?? {},
          state: "running",
        })
        this.status = `Führt ${this.toolNames.get(data.id) ?? "ein Werkzeug"} aus …`
        this.#schedule()
        break
      }
      case "session.tool.success":
      case "session.tool.failed": {
        const tool = this.tools.get(data.id)
        if (tool) {
          tool.state = event.type === "session.tool.success" ? "done" : "error"
          if (event.type === "session.tool.failed") tool.error = data.error
        }
        this.#schedule()
        break
      }
      case "session.retry.scheduled": {
        this.status = `Neuer Versuch (${data.attempt ?? 1}) …`
        this.#schedule()
        break
      }
      case "session.execution.succeeded": {
        this.finish({ ok: true })
        break
      }
      case "session.execution.failed": {
        this.finish({ ok: false, error: data.error })
        break
      }
      case "session.execution.interrupted": {
        this.finish({ ok: false, interrupted: true })
        break
      }
      default:
        break
    }
  }

  #ensureText(data) {
    const key = `${data.assistantMessageID ?? "unknown"}:${data.ordinal ?? 0}`
    if (!this.texts.has(key)) {
      this.texts.set(key, "")
      this.textOrder.push(key)
    }
    return key
  }

  #toolLines() {
    return [...this.tools.values()]
      .slice(-MAX_TOOLS)
      .map((tool) => {
        const icon = tool.state === "running" ? "⏳" : tool.state === "error" ? "❌" : "🔧"
        return `-# ${icon} ${describeTool(tool)}`
      })
  }

  #liveContent() {
    const header = "⏳ **OpenCode arbeitet …**"
    const toolBlock = this.#toolLines().join("\n")
    const text = escapeMentions(this.text)

    if (!text) {
      const status = `-# ${this.status}`
      return truncate([header, status, toolBlock].filter(Boolean).join("\n\n"), 1990)
    }

    const room = Math.max(200, 1975 - header.length - toolBlock.length - 12)
    const tail = text.length <= room ? text : `…${text.slice(-room)}`
    return [header, tail, toolBlock].filter(Boolean).join("\n\n")
  }

  #schedule() {
    if (!config.ui.stream || this.finished) return
    this.dirty = true
    if (this.timer) return

    const wait = Math.max(0, config.ui.streamUpdateMs - (Date.now() - this.lastUpdate))
    this.timer = setTimeout(() => {
      this.timer = null
      if (!this.dirty || this.finished) return
      this.dirty = false
      this.#renderLive()
    }, wait)
  }

  #renderLive() {
    if (this.finished) return Promise.resolve()
    if (this.editPromise) return this.editPromise

    this.editPromise = (async () => {
      try {
        await this.message.edit({
          content: this.#liveContent(),
          components: [this.#stopRow()],
          allowedMentions: { parse: [] },
        })
        this.lastUpdate = Date.now()
      } catch (error) {
        console.warn(`[view] Live-Update fehlgeschlagen: ${error.message}`)
      } finally {
        this.editPromise = null
      }
    })()

    return this.editPromise
  }

  #stopRow() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`stop:${this.sessionID}`)
        .setLabel("Stopp")
        .setStyle(ButtonStyle.Danger),
    )
  }

  async #loadTextFromHistory() {
    try {
      const response = await this.connection.client.message.list({
        sessionID: this.sessionID,
        type: "assistant",
        order: "asc",
        limit: 50,
      })
      const parts = []
      for (const message of response.data ?? []) {
        if ((message.time?.created ?? 0) < this.startedAt - 5_000) continue
        for (const part of message.content ?? []) {
          if (part.type === "text" && part.text?.trim()) parts.push(part.text.trim())
        }
      }
      return parts.join("\n\n")
    } catch (error) {
      console.warn(`[view] Verlauf konnte nicht geladen werden: ${error.message}`)
      return ""
    }
  }

  async finish(result = { ok: true }) {
    if (this.finished) return this.done
    this.finished = true
    clearInterval(this.typing)
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // Let an edit that is currently in flight settle before writing the result.
    if (this.editPromise) await this.editPromise.catch(() => {})

    if (result.ok && !this.text) {
      const history = await this.#loadTextFromHistory()
      if (history) {
        this.texts.set("history", history)
        this.textOrder.push("history")
      }
    }

    let body = escapeMentions(this.text)
    if (!body) {
      body = result.ok ? "✅ **Fertig** – keine Textausgabe." : ""
    }
    if (result.interrupted) body = `⏹️ **Abgebrochen.**${body ? `\n\n${body}` : ""}`
    if (!result.ok && !result.interrupted) {
      body = `> ❌ **Fehler:** ${escapeMentions(formatError(result.error))}${body ? `\n\n${body}` : ""}`
    }

    const footer = this.#footer()
    const chunks = splitMessage(body || "✅ **Fertig.**", TEXT_LIMIT)
    if (footer) {
      const last = chunks.length - 1
      if (chunks[last].length + footer.length + 2 <= 2000) chunks[last] = `${chunks[last]}\n\n${footer}`
      else chunks.push(footer)
    }

    const [first, ...rest] = chunks
    let edited = false
    try {
      await this.message.edit({
        content: first,
        components: [],
        allowedMentions: { parse: [] },
      })
      edited = true
    } catch (error) {
      console.warn(`[view] Abschluss-Edit fehlgeschlagen: ${error.message}`)
    }

    const pending = edited ? rest : chunks
    for (const chunk of pending) {
      try {
        await this.channel.send({ content: chunk, allowedMentions: { parse: [] } })
      } catch (error) {
        console.warn(`[view] Nachricht konnte nicht gesendet werden: ${error.message}`)
        break
      }
    }

    this.resolveDone(result)
    return this.done
  }

  #footer() {
    const parts = []
    if (this.agent) parts.push(`\`${this.agent}\``)
    if (this.model) parts.push(`\`${this.model}\``)
    if (this.directory) parts.push(`\`${truncate(this.directory, 80)}\``)
    if (this.steps > 0) parts.push(`${this.steps} ${this.steps === 1 ? "Schritt" : "Schritte"}`)
    const tokens = formatTokens(this.tokens)
    if (tokens) parts.push(tokens)
    if (this.cost !== null) parts.push(formatCost(this.cost))
    parts.push(formatDuration(Date.now() - this.startedAt))
    return `-# ${parts.join(" · ")}`
  }
}
