import { config } from "./config.js"
import { connectOpenCode, listAgents, listModels, modelKey } from "./opencode.js"

function ok(label, value) {
  console.log(`  ✅ ${label}: ${value}`)
}

function fail(label, error) {
  console.log(`  ❌ ${label}: ${error?.message ?? error}`)
}

console.log("OpenCode-Discord-Bot · Diagnose\n")

let connection
try {
  connection = await connectOpenCode()
  ok("OpenCode-Dienst", `v${connection.version} unter ${connection.endpoint.url}`)
} catch (error) {
  fail("OpenCode-Dienst", error)
  console.log("\nStarte OpenCode einmal mit `opencode` oder prüfe OPENCODE_URL.")
  process.exit(1)
}

try {
  const info = await connection.client.server.info()
  ok("Server-PID", info.pid)
  ok("Arbeitsverzeichnis", config.opencode.directory)
} catch (error) {
  fail("Server-Info", error)
}

try {
  const models = await listModels(connection, config.opencode.directory)
  ok("Modelle", `${models.length} verfügbar`)
  const preferred = config.opencode.model
  if (preferred) ok("Bevorzugtes Modell", preferred)
  console.log(`     Beispiele: ${models.slice(0, 5).map(modelKey).join(", ")}`)
} catch (error) {
  fail("Modelle", error)
}

try {
  const agents = await listAgents(connection, config.opencode.directory)
  ok("Agenten", agents.map((agent) => agent.id).join(", "))
} catch (error) {
  fail("Agenten", error)
}

if (config.discord.token) {
  try {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { authorization: `Bot ${config.discord.token}` },
    })
    if (response.ok) {
      const user = await response.json()
      ok("Discord-Bot", `${user.username}#${user.discriminator} (${user.id})`)
    } else {
      fail("Discord-Bot", `HTTP ${response.status} – Token ungültig?`)
    }
  } catch (error) {
    fail("Discord-Bot", error)
  }
} else {
  fail("Discord-Bot", "DISCORD_TOKEN fehlt")
}

console.log("\nFertig.")
