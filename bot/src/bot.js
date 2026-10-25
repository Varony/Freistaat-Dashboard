import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js"
import { config } from "./config.js"
import {
  escapeMentions,
  formatCost,
  formatError,
  formatTokens,
  sessionLabel,
  truncate,
} from "./format.js"
import {
  ensureSession,
  listAgents,
  listModels,
  modelKey,
  normalizeModel,
  resolveDirectory,
  resolveModel,
  switchAgent,
  switchModel,
} from "./opencode.js"
import { RunView } from "./view.js"

export const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Schickt eine Aufgabe an OpenCode")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Deine Aufgabe oder Frage").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("directory")
        .setDescription("Arbeitsverzeichnis (wechselt bei Bedarf die Session)"),
    )
    .addStringOption((option) =>
      option.setName("agent").setDescription("Agent für diese Session").setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setDescription("Modell als provider/model")
        .setAutocomplete(true),
    ),
  new SlashCommandBuilder()
    .setName("new")
    .setDescription("Startet eine neue OpenCode-Session")
    .addStringOption((option) => option.setName("title").setDescription("Titel der Session"))
    .addStringOption((option) =>
      option.setName("directory").setDescription("Arbeitsverzeichnis der Session"),
    ),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Bricht die laufende Aufgabe ab"),
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Zeigt Session, Modell und Verbrauch"),
  new SlashCommandBuilder()
    .setName("model")
    .setDescription("Zeigt oder wechselt das Modell")
    .addStringOption((option) =>
      option.setName("model").setDescription("Neues Modell").setAutocomplete(true),
    ),
  new SlashCommandBuilder()
    .setName("agent")
    .setDescription("Zeigt oder wechselt den Agenten")
    .addStringOption((option) =>
      option.setName("agent").setDescription("Neuer Agent").setAutocomplete(true),
    ),
  new SlashCommandBuilder()
    .setName("compact")
    .setDescription("Verdichtet den Gesprächskontext der Session"),
  new SlashCommandBuilder()
    .setName("sessions")
    .setDescription("Listet die letzten Sessions im Verzeichnis"),
]

class ChannelQueue {
  constructor() {
    this.chains = new Map()
    this.pending = new Map()
    this.generation = new Map()
  }

  position(channelID) {
    return this.pending.get(channelID) ?? 0
  }

  push(channelID, task) {
    const generation = this.generation.get(channelID) ?? 0
    const position = this.position(channelID)
    this.pending.set(channelID, position + 1)

    const previous = this.chains.get(channelID) ?? Promise.resolve()
    const run = previous.then(
      () => {
        const skipped = (this.generation.get(channelID) ?? 0) !== generation
        return task({ skipped })
      },
      () => task({ skipped: false }),
    )

    const settled = run
      .catch((error) => console.error("[queue] Aufgabe fehlgeschlagen:", error))
      .finally(() => {
        const left = (this.pending.get(channelID) ?? 1) - 1
        if (left <= 0) {
          this.pending.delete(channelID)
          this.chains.delete(channelID)
          this.generation.delete(channelID)
        } else {
          this.pending.set(channelID, left)
        }
      })

    this.chains.set(channelID, settled)
    return position
  }

  /** Queued tasks are skipped, the running task is stopped via session.interrupt. */
  cancelPending(channelID) {
    if (this.position(channelID) === 0) return
    this.generation.set(channelID, (this.generation.get(channelID) ?? 0) + 1)
  }
}

export class BotApp {
  constructor({ connection, store, bot }) {
    this.oc = connection
    this.store = store
    this.bot = bot
    this.runs = new Map()
    this.queues = new Map()
    this.childToRoot = new Map()
  }

  #allowed(userID, channelID) {
    const { allowedUsers, allowedChannels } = config.discord
    if (allowedUsers.length > 0 && !allowedUsers.includes(userID)) return false
    if (allowedChannels.length > 0 && !allowedChannels.includes(channelID)) return false
    return true
  }

  #queue(channelID) {
    let queue = this.queues.get(channelID)
    if (!queue) {
      queue = new ChannelQueue()
      this.queues.set(channelID, queue)
    }
    return queue
  }

  #directoryFor(channelID, requested) {
    const record = this.store.get(channelID)
    return resolveDirectory(requested ?? record?.directory)
  }

  async #agentOption(input, directory) {
    if (!input) return undefined
    const agents = await listAgents(this.oc, directory)
    const wanted = input.trim().toLowerCase()
    const agent = agents.find(
      (entry) => entry.id.toLowerCase() === wanted || entry.name.toLowerCase() === wanted,
    )
    if (!agent) {
      throw new Error(
        `Agent "${input}" nicht gefunden. Verfügbar: ${agents.map((entry) => entry.id).join(", ")}`,
      )
    }
    return agent.id
  }

  async #modelOption(input, directory) {
    if (!input) return undefined
    return resolveModel(this.oc, directory, input)
  }

  async #createSession(channel, { directory, agent, model, title }) {
    const record = this.store.get(channel.id)
    const resolvedAgent = agent ?? record?.agent ?? config.opencode.agent ?? undefined
    let resolvedModel = model ?? record?.model ?? undefined

    if (!resolvedModel && config.opencode.model) {
      resolvedModel = await resolveModel(this.oc, directory, config.opencode.model)
    }

    const info = await this.oc.client.session.create({
      title: title ?? `Discord · #${channel.name ?? "DM"}`,
      location: { directory },
      ...(resolvedAgent ? { agent: resolvedAgent } : {}),
      ...(resolvedModel ? { model: resolvedModel } : {}),
    })

    return {
      info,
      record: this.store.set(channel.id, {
        sessionID: info.id,
        directory,
        agent: info.agent ?? resolvedAgent ?? null,
        model: normalizeModel(info.model ?? resolvedModel),
        title: info.title ?? title ?? null,
      }),
    }
  }

  async onInteraction(interaction) {
    if (interaction.isAutocomplete()) {
      await this.#autocomplete(interaction)
      return
    }

    if (!interaction.inGuild() && !interaction.channel) return

    if (!this.#allowed(interaction.user.id, interaction.channelId)) {
      const message = "⛔ Du bist für diesen Bot nicht freigeschaltet."
      if (interaction.isRepliable()) {
        await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => {})
      }
      return
    }

    if (interaction.isButton()) {
      const [scope, action, sessionID, requestID] = interaction.customId.split(":")
      if (scope === "stop") {
        await this.#stopButton(interaction, action ?? sessionID)
      } else if (scope === "perm") {
        await this.#permissionButton(interaction, action, sessionID, requestID)
      }
      return
    }

    if (!interaction.isChatInputCommand()) return

    if (!interaction.channel) {
      await interaction
        .reply({
          content: "❌ Dieser Channel ist für den Bot nicht verfügbar.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {})
      return
    }

    try {
      switch (interaction.commandName) {
        case "ask":
          await this.#handleAsk(interaction)
          break
        case "new":
          await this.#handleNew(interaction)
          break
        case "stop":
          await this.#handleStop(interaction)
          break
        case "status":
          await this.#handleStatus(interaction)
          break
        case "model":
          await this.#handleModel(interaction)
          break
        case "agent":
          await this.#handleAgent(interaction)
          break
        case "compact":
          await this.#handleCompact(interaction)
          break
        case "sessions":
          await this.#handleSessions(interaction)
          break
        default:
          break
      }
    } catch (error) {
      console.error(`[bot] /${interaction.commandName} fehlgeschlagen:`, error)
      const content = `> ❌ **Fehler:** ${escapeMentions(formatError(error))}`
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content, allowedMentions: { parse: [] } }).catch(() => {})
      } else {
        await interaction
          .reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } })
          .catch(() => {})
      }
    }
  }

  async #handleAsk(interaction) {
    const prompt = interaction.options.getString("prompt", true)
    let directory
    try {
      directory = this.#directoryFor(interaction.channelId, interaction.options.getString("directory"))
    } catch (error) {
      await interaction.reply({
        content: `> ❌ ${escapeMentions(formatError(error))}`,
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const channel = interaction.channel
    await interaction.reply({
      content: "⏳ **OpenCode startet …**",
      allowedMentions: { parse: [] },
    })
    const liveMessage = await interaction.fetchReply()

    let agent
    let model
    try {
      agent = await this.#agentOption(interaction.options.getString("agent"), directory)
      model = await this.#modelOption(interaction.options.getString("model"), directory)
    } catch (error) {
      await liveMessage
        .edit({
          content: `> ❌ **Fehler:** ${escapeMentions(formatError(error))}`,
          allowedMentions: { parse: [] },
        })
        .catch(() => {})
      return
    }

    this.#enqueue(channel, liveMessage, {
      prompt,
      directory,
      agent,
      model,
    })
  }

  async #handleNew(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const previous = this.store.get(interaction.channelId)
    const directory = this.#directoryFor(interaction.channelId, interaction.options.getString("directory"))
    const title = interaction.options.getString("title") ?? undefined
    const { info, record } = await this.#createSession(interaction.channel, {
      directory,
      title,
    })

    const running = Boolean(previous && this.runs.has(previous.sessionID))
    const embed = new EmbedBuilder()
      .setTitle("Neue Session")
      .setColor(0x7c3aed)
      .addFields(
        { name: "ID", value: `\`${info.id}\`` },
        { name: "Verzeichnis", value: `\`${directory}\``, inline: true },
        { name: "Agent", value: `\`${record.agent ?? "Standard"}\``, inline: true },
        { name: "Modell", value: `\`${modelKey(record.model)}\``, inline: true },
      )
      .setFooter({ text: running ? "Hinweis: Die vorherige Aufgabe läuft noch weiter." : "Bereit." })

    await interaction.editReply({ embeds: [embed] })
  }

  async #handleStop(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    this.#queue(interaction.channelId).cancelPending(interaction.channelId)

    const record = this.store.get(interaction.channelId)
    if (!record) {
      await interaction.editReply("Es gibt noch keine Session in diesem Channel.")
      return
    }

    const result = await this.oc.client.session.interrupt({ sessionID: record.sessionID })
    await interaction.editReply(
      result.interrupted
        ? "⏹️ Die Aufgabe wird abgebrochen. Wartende Aufgaben wurden verworfen."
        : "Es läuft gerade keine Aufgabe. Wartende Aufgaben wurden verworfen.",
    )
  }

  async #handleStatus(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const record = this.store.get(interaction.channelId)
    if (!record) {
      await interaction.editReply("Noch keine Session. Nutze `/ask` oder `/new`.")
      return
    }

    let info
    try {
      info = await this.oc.client.session.get({ sessionID: record.sessionID })
    } catch {
      await interaction.editReply(
        `Die gespeicherte Session \`${record.sessionID}\` existiert nicht mehr. Nutze \`/new\`.`,
      )
      return
    }

    const active = await this.oc.client.session.active().catch(() => ({}))
    const running = Boolean(active[record.sessionID]) || this.runs.has(record.sessionID)
    const tokens = info.tokens ?? record.tokens
    const tokenText = formatTokens(tokens) ?? "0 Tokens"

    const embed = new EmbedBuilder()
      .setTitle(running ? "Session · läuft" : "Session · bereit")
      .setColor(running ? 0xf59e0b : 0x7c3aed)
      .addFields(
        { name: "Titel", value: truncate(info.title ?? record.title ?? "Ohne Titel", 100) },
        { name: "ID", value: `\`${info.id}\`` },
        { name: "Verzeichnis", value: `\`${info.location?.directory ?? record.directory}\`` },
        { name: "Agent", value: `\`${info.agent ?? record.agent ?? "Standard"}\``, inline: true },
        {
          name: "Modell",
          value: `\`${modelKey(info.model ?? record.model)}\``,
          inline: true,
        },
        { name: "Verbrauch", value: `${tokenText} · ${formatCost(info.cost)}`, inline: true },
        {
          name: "Warteschlange",
          value: `${Math.max(0, this.#queue(interaction.channelId).position(interaction.channelId) - (running ? 1 : 0))}`,
          inline: true,
        },
        {
          name: "Erstellt",
          value: `<t:${Math.floor((info.time?.created ?? Date.now()) / 1000)}:R>`,
          inline: true,
        },
      )

    await interaction.editReply({ embeds: [embed] })
  }

  async #handleModel(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const input = interaction.options.getString("model")
    const directory = this.#directoryFor(interaction.channelId)

    if (!input) {
      const record = this.store.get(interaction.channelId)
      const models = await listModels(this.oc, directory).catch(() => [])
      const suggestions = models
        .slice(0, 8)
        .map((model) => `\`${modelKey(model)}\` – ${truncate(model.name, 40)}`)
        .join("\n")

      await interaction.editReply({
        content: [
          `Aktuelles Modell: \`${modelKey(record?.model)}\``,
          suggestions ? `\n**Beispiele:**\n${suggestions}` : "",
          "\nNutze `/model model:<provider/model>` zum Wechseln.",
        ].join("\n"),
        allowedMentions: { parse: [] },
      })
      return
    }

    const model = await this.#modelOption(input, directory)
    await switchModel(this.oc, this.store, interaction.channelId, model)
    await interaction.editReply(`✅ Modell gewechselt zu \`${modelKey(model)}\`.`)
  }

  async #handleAgent(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const input = interaction.options.getString("agent")
    const directory = this.#directoryFor(interaction.channelId)
    const agents = await listAgents(this.oc, directory)

    if (!input) {
      const lines = agents.map(
        (agent) => `\`${agent.id}\` – ${truncate(agent.description ?? agent.name, 80)}`,
      )
      const record = this.store.get(interaction.channelId)
      await interaction.editReply({
        content: [
          `Aktueller Agent: \`${record?.agent ?? "Standard"}\``,
          "",
          lines.join("\n"),
          "",
          "Nutze `/agent agent:<id>` zum Wechseln.",
        ].join("\n"),
        allowedMentions: { parse: [] },
      })
      return
    }

    const agent = await this.#agentOption(input, directory)
    await switchAgent(this.oc, this.store, interaction.channelId, agent)
    await interaction.editReply(`✅ Agent gewechselt zu \`${agent}\`.`)
  }

  async #handleCompact(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const record = this.store.get(interaction.channelId)
    if (!record) {
      await interaction.editReply("Noch keine Session. Nutze `/ask` oder `/new`.")
      return
    }
    await this.oc.client.session.compact({ sessionID: record.sessionID })
    await interaction.editReply("🗜️ Der Gesprächskontext wird verdichtet.")
  }

  async #handleSessions(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const directory = this.#directoryFor(interaction.channelId)
    const record = this.store.get(interaction.channelId)
    const response = await this.oc.client.session.list({ directory, limit: 10, order: "desc" })

    if (!response.data?.length) {
      await interaction.editReply(`Keine Sessions in \`${directory}\`.`)
      return
    }

    const embed = new EmbedBuilder()
      .setTitle(`Sessions in ${truncate(directory, 80)}`)
      .setColor(0x7c3aed)
      .setDescription(
        response.data
          .map((info) => sessionLabel(info, info.id === record?.sessionID))
          .join("\n"),
      )

    await interaction.editReply({ embeds: [embed] })
  }

  async #autocomplete(interaction) {
    if (!this.#allowed(interaction.user.id, interaction.channelId)) {
      await interaction.respond([]).catch(() => {})
      return
    }

    const focused = interaction.options.getFocused(true)
    const query = String(focused.value ?? "").toLowerCase()

    try {
      const directory = this.#directoryFor(interaction.channelId)

      if (focused.name === "model") {
        const models = await listModels(this.oc, directory)
        const choices = models
          .filter((model) => {
            const key = modelKey(model).toLowerCase()
            return key.includes(query) || model.name.toLowerCase().includes(query)
          })
          .slice(0, 25)
          .map((model) => ({
            name: truncate(`${model.name} (${model.providerID})`, 100),
            value: modelKey(model),
          }))
        await interaction.respond(choices)
        return
      }

      if (focused.name === "agent") {
        const agents = await listAgents(this.oc, directory)
        const choices = agents
          .filter(
            (agent) =>
              agent.id.toLowerCase().includes(query) || agent.name.toLowerCase().includes(query),
          )
          .slice(0, 25)
          .map((agent) => ({
            name: truncate(`${agent.id} – ${agent.name}`, 100),
            value: agent.id,
          }))
        await interaction.respond(choices)
        return
      }

      await interaction.respond([])
    } catch (error) {
      console.warn("[autocomplete]", error.message)
      await interaction.respond([]).catch(() => {})
    }
  }

  #enqueue(channel, liveMessage, payload) {
    const queue = this.#queue(channel.id)
    const position = queue.push(channel.id, async ({ skipped }) => {
      if (skipped) {
        await liveMessage
          .edit({
            content: "⏹️ Abgebrochen (Warteschlange wurde geleert).",
            components: [],
            allowedMentions: { parse: [] },
          })
          .catch(() => {})
        return
      }
      await this.#executeRun({ channel, liveMessage, ...payload })
    })

    if (position > 0) {
      void liveMessage
        .edit({
          content: `⏳ In Warteschlange (Position ${position}) …`,
          allowedMentions: { parse: [] },
        })
        .catch(() => {})
    }
  }

  async #executeRun({ channel, liveMessage, prompt, directory, agent, model, title }) {
    let sessionID
    try {
      const { info } = await ensureSession(this.oc, this.store, channel.id, {
        directory,
        agent,
        model,
        title: title ?? `Discord · #${channel.name ?? "DM"}`,
      })
      sessionID = info.id
    } catch (error) {
      await liveMessage
        .edit({
          content: `> ❌ **Session konnte nicht erstellt werden:** ${escapeMentions(formatError(error))}`,
          allowedMentions: { parse: [] },
        })
        .catch(() => {})
      return
    }

    const view = new RunView({
      connection: this.oc,
      channel,
      message: liveMessage,
      sessionID,
      directory,
      prompt,
    })
    this.runs.set(sessionID, view)

    const timeout = setTimeout(() => {
      this.oc.client.session.interrupt({ sessionID }).catch(() => {})
      void view.finish({
        ok: false,
        error: { message: `Zeitüberschreitung nach ${Math.round(config.opencode.requestTimeoutMs / 60000)} Minuten` },
      })
    }, config.opencode.requestTimeoutMs)

    try {
      view.start()
      await this.oc.client.session.prompt({ sessionID, text: prompt })
      await view.done
    } catch (error) {
      await view.finish({ ok: false, error })
    } finally {
      clearTimeout(timeout)
      this.runs.delete(sessionID)
      for (const [child, root] of this.childToRoot) {
        if (root === sessionID) this.childToRoot.delete(child)
      }
    }
  }

  onEvent(event) {
    const sessionID = event.data?.sessionID

    // Subagents run in child sessions. Remember which run they belong to so
    // their permission requests still reach the right Discord channel.
    if (event.type === "session.created" && sessionID && event.data.parentID) {
      const root = this.childToRoot.get(event.data.parentID) ?? event.data.parentID
      if (this.runs.has(root)) this.childToRoot.set(sessionID, root)
      return
    }

    if (event.type === "permission.asked") {
      const root = (sessionID && this.childToRoot.get(sessionID)) || sessionID
      void this.#handlePermission(event.data, root)
      return
    }

    if (!sessionID) return
    this.runs.get(sessionID)?.handleEvent(event)
  }

  async #handlePermission(data, rootSessionID = data.sessionID) {
    const run = this.runs.get(rootSessionID)
    const channelID = run?.channel?.id ?? this.store.findChannelBySession(rootSessionID)
    if (!channelID) return

    const channel =
      run?.channel ?? (await this.bot.channels.fetch(channelID).catch(() => null))
    if (!channel?.isTextBased() || !channel.send) return

    const resources = (data.resources ?? [])
      .slice(0, 8)
      .map((resource) => `- \`${truncate(resource, 140)}\``)

    const content = [
      "🔐 **Berechtigung angefragt**",
      data.message ? `> ${truncate(data.message, 400)}` : null,
      `**Aktion:** \`${data.action}\``,
      resources.length ? `**Ressourcen:**\n${resources.join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n\n")

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`perm:once:${data.sessionID}:${data.id}`)
        .setLabel("Einmal erlauben")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`perm:always:${data.sessionID}:${data.id}`)
        .setLabel("Immer erlauben")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`perm:reject:${data.sessionID}:${data.id}`)
        .setLabel("Ablehnen")
        .setStyle(ButtonStyle.Danger),
    )

    await channel
      .send({ content: truncate(content, 1900), components: [row], allowedMentions: { parse: [] } })
      .catch((error) => console.warn("[permission] Nachricht fehlgeschlagen:", error.message))
  }

  async #stopButton(interaction, sessionID) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    this.#queue(interaction.channelId).cancelPending(interaction.channelId)
    const result = await this.oc.client.session.interrupt({ sessionID }).catch(() => ({ interrupted: false }))
    await interaction.editReply(
      result.interrupted
        ? "⏹️ Aufgabe wird abgebrochen. Wartende Aufgaben wurden verworfen."
        : "Es läuft gerade keine Aufgabe. Wartende Aufgaben wurden verworfen.",
    )
  }

  async #permissionButton(interaction, decision, sessionID, requestID) {
    const labels = { once: "einmal erlaubt", always: "dauerhaft erlaubt", reject: "abgelehnt" }
    await interaction.deferUpdate()

    try {
      await this.oc.client.permission.reply({ sessionID, requestID, decision })
      const original = interaction.message?.content ?? ""
      await interaction.editReply({
        content: truncate(`${original}\n\n✅ **${labels[decision] ?? decision}** von <@${interaction.user.id}>`, 2000),
        components: [],
        allowedMentions: { parse: [] },
      })
    } catch (error) {
      await interaction
        .followUp({
          content: `> ❌ ${escapeMentions(formatError(error))}`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {})
    }
  }

  async onMessage(message) {
    if (!this.bot.user || message.author.bot) return
    if (!message.mentions.has(this.bot.user)) return
    if (!this.#allowed(message.author.id, message.channelId)) return

    const prompt = message.content
      .replaceAll(`<@${this.bot.user.id}>`, "")
      .replaceAll(`<@!${this.bot.user.id}>`, "")
      .trim()

    if (!prompt) {
      await message
        .reply({
          content: "Schreib mir eine Aufgabe, z. B. `@Bot erklär mir dieses Projekt`.",
          allowedMentions: { repliedUser: false },
        })
        .catch(() => {})
      return
    }

    let directory
    try {
      directory = this.#directoryFor(message.channelId)
    } catch (error) {
      await message.reply({ content: `> ❌ ${escapeMentions(formatError(error))}` }).catch(() => {})
      return
    }

    const liveMessage = await message
      .reply({ content: "⏳ **OpenCode startet …**", allowedMentions: { repliedUser: false } })
      .catch(() => null)

    if (!liveMessage) return

    this.#enqueue(message.channel, liveMessage, {
      prompt,
      directory,
      agent: undefined,
      model: undefined,
      title: undefined,
    })
  }
}
