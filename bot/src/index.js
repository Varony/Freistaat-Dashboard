import { Client, Events, GatewayIntentBits, Partials } from "discord.js"
import { config, requireDiscordToken } from "./config.js"
import { connectOpenCode, startEventStream } from "./opencode.js"
import { Store } from "./store.js"
import { BotApp, commands } from "./bot.js"

let token
try {
  token = requireDiscordToken()
} catch (error) {
  console.error(`\n❌ ${error.message}\n`)
  process.exit(1)
}

console.log("[opencode] Verbinde mit dem Dienst …")
let connection
try {
  connection = await connectOpenCode()
} catch (error) {
  console.error(`\n❌ OpenCode-Dienst nicht erreichbar: ${error.message}`)
  console.error("   Prüfe `opencode service status` oder setze OPENCODE_URL.\n")
  process.exit(1)
}
console.log(`[opencode] v${connection.version} verbunden (${connection.endpoint.url})`)
console.log(`[opencode] Standardverzeichnis: ${config.opencode.directory}`)

const store = new Store(config.dataFile)
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
})

const app = new BotApp({ connection, store, bot })
const stopEvents = startEventStream(connection, (event) => app.onEvent(event))

bot.once(Events.ClientReady, async (ready) => {
  console.log(`[discord] Eingeloggt als ${ready.user.tag}`)

  try {
    if (config.discord.guildID) {
      await ready.application.commands.set(commands, config.discord.guildID)
      console.log(`[discord] ${commands.length} Slash-Commands für Guild ${config.discord.guildID} registriert`)
    } else {
      await ready.application.commands.set(commands)
      console.log(`[discord] ${commands.length} globale Slash-Commands registriert (kann bis zu 1 h dauern)`)
    }
  } catch (error) {
    console.error("[discord] Command-Registrierung fehlgeschlagen:", error)
  }

  if (!config.discord.allowedUsers.length && !config.discord.allowedChannels.length) {
    console.warn(
      "[discord] Keine Allowlist gesetzt: Jeder im Server kann OpenCode steuern. " +
        "Setze DISCORD_ALLOWED_USERS oder DISCORD_ALLOWED_CHANNELS.",
    )
  }
})

bot.on(Events.InteractionCreate, (interaction) => {
  void app.onInteraction(interaction)
})

bot.on(Events.MessageCreate, (message) => {
  void app.onMessage(message)
})

bot.on(Events.Error, (error) => console.error("[discord] Client-Fehler:", error))

try {
  await bot.login(token)
} catch (error) {
  console.error(`\n❌ Discord-Login fehlgeschlagen: ${error.message}\n`)
  stopEvents()
  process.exit(1)
}

let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n[bot] ${signal} empfangen, beende …`)
  stopEvents()
  await bot.destroy().catch(() => {})
  process.exit(0)
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void shutdown(signal))

process.on("unhandledRejection", (error) => {
  console.error("[bot] Unbehandelte Rejection:", error)
})
