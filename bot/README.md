# Freistaat Bot

Discord-Bot für das Freistaat-Projekt. Er verbindet einen Discord-Channel mit
einer lokalen [OpenCode](https://opencode.ai)-Instanz: Aus Discord heraus
programmieren, Dateien lesen und ändern, Befehle ausführen, Fragen zum Projekt
stellen.

Dieser Ordner ist ein eigenständiges Node-Projekt mit eigener `package.json`.
Die Website liegt im übergeordneten Verzeichnis.

## Schnellstart

```bash
npm install
cp .env.example .env      # DISCORD_TOKEN eintragen
npm run doctor            # Verbindung zu OpenCode und Discord prüfen
npm start
```

Beim ersten Start werden die Slash-Commands registriert. Danach im Discord
`/ask` eingeben.

Aus dem Repository-Hauptverzeichnis geht es auch über die Root-Skripte:

```bash
npm run bot:doctor
npm run bot:start
npm run bot:dev
npm run test:bot
```

## Voraussetzungen

- Node.js **20.9 oder neuer**
- OpenCode **V2** installiert und eingerichtet (`opencode --version`)
- Discord-Bot mit aktiviertem **Message Content Intent**, Scopes `bot` und
  `applications.commands`, Rechten **Send Messages**, **Read Message History**,
  **Embed Links**

## Commands

| Command | Beschreibung |
| --- | --- |
| `/ask prompt:<text>` | Schickt eine Aufgabe an OpenCode. Optional `directory`, `agent`, `model`. |
| `/new [title] [directory]` | Startet eine frische Session. |
| `/stop` | Bricht die laufende Aufgabe ab und leert die Warteschlange. |
| `/status` | Zeigt Session-ID, Verzeichnis, Agent, Modell, Tokens und Kosten. |
| `/model [model]` | Zeigt das aktuelle Modell oder wechselt es (`provider/model`). |
| `/agent [agent]` | Zeigt verfügbare Agenten oder wechselt den Agenten. |
| `/compact` | Verdichtet den Gesprächskontext. |
| `/sessions` | Listet die letzten Sessions im aktuellen Verzeichnis. |

Alternativ den Bot einfach erwähnen:

```text
@MeinBot erklär mir die Struktur dieses Projekts
```

## Arbeitsverzeichnis

Standardmäßig arbeitet OpenCode in diesem Ordner (`bot/`). Um die Website zu
bearbeiten:

```dotenv
OPENCODE_DIRECTORY=..
```

oder pro Aufgabe `/ask directory:..`. Das Verzeichnis bleibt pro Channel
gespeichert.

## Konfiguration

Siehe `.env.example`. Alle Werte werden beim Start aus `.env` geladen.

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `DISCORD_TOKEN` | – | **Pflicht.** Bot-Token. |
| `DISCORD_GUILD_ID` | – | Guild für sofortige Command-Registrierung. |
| `DISCORD_ALLOWED_USERS` | alle | Kommagetrennte User-IDs, die den Bot nutzen dürfen. |
| `DISCORD_ALLOWED_CHANNELS` | alle | Kommagetrennte Channel-IDs, in denen der Bot reagiert. |
| `OPENCODE_URL` | lokaler Dienst | Entfernter OpenCode-Server. |
| `OPENCODE_AUTH` | – | `user:passwort` für Basic Auth. |
| `OPENCODE_TOKEN` | – | Bearer-Token. |
| `OPENCODE_DIRECTORY` | `bot/` | Standard-Arbeitsverzeichnis. |
| `OPENCODE_AGENT` | OpenCode-Standard | Standard-Agent. |
| `OPENCODE_MODEL` | OpenCode-Standard | Standardmodell (`provider/model`). |
| `OPENCODE_TIMEOUT_MS` | `1800000` | Maximale Laufzeit (30 min). |
| `STREAM_UPDATE_MS` | `1500` | Abstand der Live-Updates. |
| `STREAM_OUTPUT` | `true` | `false` deaktiviert die Live-Vorschau. |
| `STATE_FILE` | `.data/state.json` | Channel→Session-Zuordnung. |

## Sicherheit

> Der Bot gibt jedem, der ihn benutzen darf, indirekt Shell- und Dateizugriff
> auf das Arbeitsverzeichnis. Setze mindestens `DISCORD_ALLOWED_USERS` oder
> `DISCORD_ALLOWED_CHANNELS`, wenn der Bot auf einem öffentlichen Server läuft.

## Aufbau

```text
src/
  index.js      Discord-Client, Login, Command-Registrierung
  bot.js        Commands, Warteschlange, Event-Routing, Berechtigungen
  view.js       Live-Streaming und finale Ausgabe
  opencode.js   Verbindung, Sessions, Modelle, Agenten, Event-Stream
  store.js      Persistente Channel→Session-Zuordnung
  format.js     Chunking, Discord-Markdown, Formatierung
  config.js     Umgebungsvariablen
  doctor.js     Diagnose
test/
  format.test.js
```

## Fehlerbehebung

- **„OpenCode-Dienst nicht erreichbar“** – `opencode service status`, ggf.
  `opencode service restart`, oder `OPENCODE_URL` setzen.
- **Slash-Commands erscheinen nicht** – ohne `DISCORD_GUILD_ID` dauert die
  globale Registrierung bis zu einer Stunde; mit `applications.commands`
  einladen und Bot neu starten.
- **Keine Reaktion auf @Erwähnungen** – Message Content Intent aktivieren.
- **„Unknown interaction“** – `OPENCODE_TIMEOUT_MS` erhöhen.
- **Rate-Limits bei Live-Updates** – `STREAM_UPDATE_MS` erhöhen.

## Tests

```bash
npm test        # hier im bot/-Ordner
npm run test:bot  # aus dem Repository-Hauptverzeichnis
```
