# Freistaat

Website und Discord-Bot für eine Demokratie-Simulation im Discord: Wahlen,
Bürgerbegehren, Gesetze und Parteien an einem Ort.

Das Repository enthält zwei Teile:

- **Website** (Wurzel, Next.js) – Wahlen, Bürgerbegehren, Gesetzblatt, Parteien.
- **Discord-Bot** (`bot/`) – verbindet Discord mit OpenCode und wird für die
  Arbeit an diesem Projekt aus Discord heraus genutzt.

Aktueller Stand der Website: **klickbarer Prototyp mit Beispieldaten**. Das
Gesetzblatt wird bereits automatisch aus Discord synchronisiert. Anmeldung und
echte Stimmabgabe fehlen noch; die übrigen Daten liegen in `lib/mock-data.ts`.
Status und Fristen werden aus den Daten abgeleitet. Kandidatur,
Parteigründung und Bürgerbegehren-Einreichung sind als Demo gekennzeichnet –
der tatsächliche Weg führt über den Discord-Server.

## Entwicklung

Website:

```bash
npm install
npm run dev
```

Öffne http://localhost:3000.

```bash
npm run build       # Produktionsbuild
npm run lint        # ESLint
npm test            # Tests für den Discord-Sync
```

Bot (eigene Abhängigkeiten in `bot/`):

```bash
npm install --prefix bot
cp bot/.env.example bot/.env   # Token eintragen
npm run bot:doctor             # Verbindung zu OpenCode und Discord prüfen
npm run bot:start              # Bot starten
npm run test:bot               # Bot-Tests
```

Details: [Discord-Bot](#discord-bot) unten.

## Discord-Sync

Die Gesetze liegen in drei Discord-Channels:

- `#verfassung` – Verfassung des Freistaates
- `#recht-und-ordnung` – Recht und Ordnung
- `#verfügen` – Einstweilige Verfügungen

Jedes einzelne Gesetz ist eine eigene Nachricht. Die Zuordnung Dokument →
Channel → Datei steht in `law-documents.json`.

Ablauf:

1. **Gesetze nach Discord veröffentlichen** (`publish-laws.yml`) liest die
   drei Markdown-Dateien, teilt sie in einzelne Gesetze und legt bzw.
   aktualisiert Channels und Nachrichten. Der Workflow ist idempotent; der
   Fortschritt steht in `content/discord-publish-state.json`.
2. **Gesetze aus Discord** (`sync-laws-from-discord.yml`) liest die drei
   Channels alle 15 Minuten und schreibt `content/*.md` sowie
   `content/discord-channels.json`.
3. Vercel baut die Website nach jedem Commit neu.

Die Website liest die drei Dateien direkt. Jedes Dokument verlinkt auf seinen
Discord-Channel.

Benötigte Repository-Konfiguration:

| Name | Typ | Bedeutung |
| --- | --- | --- |
| `BOTTOKEN` | Secret | Token des Discord-Bots (`DISCORD_BOT_TOKEN` wird ebenfalls akzeptiert) |
| `DISCORD_GUILD_ID` | Variable | Server-ID |
| `DISCORD_CHANNEL_ID` | Variable (optional) | Übersichts-Channel für die Index-Nachricht (aktuell nicht gesetzt) |
| `VERCEL_DEPLOY_HOOK` | Secret (optional) | Vercel Deploy Hook, falls die Git-Integration den Production-Deploy nicht auslöst |
| `WEBHOOKURL` | Secret | Wird nicht mehr benötigt |

Der Bot benötigt **Channel ansehen**, **Nachrichtenverlauf lesen**,
**Nachrichten senden**, **Nachrichten verwalten** und **Channels verwalten**
(für das Anlegen und Aktualisieren der Gesetzes-Channels). Im Developer Portal
muss der **Message Content Intent** aktiviert sein.

Für Vercel muss der **Production Branch** auf `master` stehen. Falls die
Live-Domain trotz erfolgreicher Deployments einen alten Stand zeigt, hilft ein
Deploy Hook (Vercel → Settings → Git → Deploy Hooks), der als Secret
`VERCEL_DEPLOY_HOOK` hinterlegt wird.

Manuell:

1. GitHub → **Actions** → **Gesetze nach Discord veröffentlichen** →
   **Run workflow** (zuerst mit `dry_run = true`).
2. GitHub → **Actions** → **Gesetze aus Discord** → **Run workflow**
   (optional ebenfalls mit `dry_run`).

Lokal testen (Token nur in der lokalen `.env`, nicht committen):

```bash
cp .env.example .env
# DISCORD_BOT_TOKEN, DISCORD_GUILD_ID und DISCORD_INDEX_CHANNEL_ID eintragen
npm run publish:discord
npm run sync:discord
```

## Struktur

```
app/                 Seiten (Next.js App Router)
components/          Layout- und UI-Komponenten
  ui.tsx             Card, Badge, Button, Progress, Avatar, Stat …
  vote-form.tsx      Stimmabgabe (Demo, localStorage)
  initiative-sign.tsx Unterschrift (Demo, localStorage)
lib/
  site-config.ts     Name, Navigation, Discord-Link
  mock-data.ts       Beispieldaten: Wahlen, Begehren, Parteien, Gesetze
  laws.ts            liest content/*.md, Fallback auf Beispieldaten
  types.ts           Datentypen
content/
  Verfassung des Freistaates.md   aus #verfassung generiert
  Recht und Ordnung.md            aus #recht-und-ordnung generiert
  Einstweilige Verfügungen.md     aus #verfügen generiert
  discord-channels.json           Channel-IDs für die Website
  discord-publish-state.json      Nachrichten-IDs für idempotentes Publishing
law-documents.json   Dokument → Channel → Datei + Trennregel
scripts/
  law-documents.mjs            Splitter und Discord-Normalisierung
  publish-laws.mjs             Markdown → Discord
  sync-laws-from-discord.mjs   Discord → Markdown
.github/workflows/
  publish-laws.yml               manuelles Veröffentlichen/Update
  sync-laws-from-discord.yml     Zeitplan und Commit
test/
  law-documents.test.mjs
  sync-laws.test.mjs
bot/                 Discord-Bot mit OpenCode-Anbindung
  package.json       eigene Abhängigkeiten (discord.js, @opencode/client)
  .env.example       Vorlage für bot/.env
  src/
    index.js         Einstiegspunkt: Discord-Client, Login, Command-Registrierung
    bot.js           Commands, Warteschlange, Event-Routing, Berechtigungen
    view.js          Live-Streaming und finale Ausgabe einer Aufgabe
    opencode.js      Verbindung, Sessions, Modelle, Agenten, Event-Stream
    store.js         Persistente Channel→Session-Zuordnung
    format.js        Chunking, Discord-Markdown, Formatierung
    config.js        Umgebungsvariablen
    doctor.js        Diagnose
  test/
    format.test.js
```

`next-env.d.ts` und `.next/` werden beim Build erzeugt und sind nicht
eingecheckt. `AGENTS.md` beschreibt die Entwicklung mit Test- und
Produktionsserver.

## Design anpassen

Alle Gestaltungs-Tokens stehen oben in `app/globals.css`:

- `--app-bg`, `--app-surface`, `--app-border`, `--app-text`, `--app-muted`
- `--app-accent` (aktuell neutral, später Gold/Blau/Rot)
- `--app-font-sans` (aktuell Systemschrift)
- `--app-radius`

Die Tailwind-Klassen (`bg-bg`, `text-muted`, `border-border`, `rounded-card`)
hängen daran. Für einen Wechsel des Grundstils reicht es, diese Variablen zu
ändern. Ein helles Theme kann später über einen zweiten Tokensatz ergänzt
werden.

## Discord-Bot

Der Bot in `bot/` leitet Discord-Nachrichten an eine lokale
[OpenCode](https://opencode.ai)-Instanz weiter. Du kannst aus einem Channel
oder Thread heraus programmieren, Dateien ändern, Befehle ausführen und Fragen
zum Projekt stellen.

### Voraussetzungen

- Node.js **20.12 oder neuer**
- OpenCode **V2** installiert und eingerichtet (`opencode --version`)
- Ein Discord-Bot-Account im
  [Developer Portal](https://discord.com/developers/applications)

Im Developer Portal aktivieren: **Message Content Intent** (für
@Erwähnungen). Eingeladen wird mit den Scopes `bot`, `applications.commands`
und mindestens den Rechten **Send Messages**, **Read Message History** und
**Embed Links**.

### Funktionen

- Slash-Commands für OpenCode-Aufgaben, Sessions, Modelle und Agenten
- @Erwähnung funktioniert ebenfalls (auch in DMs)
- Live-Streaming der Antwort inklusive Werkzeug-Aufrufen, mit Stopp-Button
- Berechtigungs-Anfragen von OpenCode als Discord-Nachricht mit Buttons
  (einmal / immer / ablehnen)
- Eine Session pro Channel oder Thread, automatisch gespeichert und nach
  einem Neustart weiterverwendet
- Warteschlange pro Channel, damit parallele Aufgaben nacheinander laufen

### Commands

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

### Verzeichnisse und Sessions

Jeder Channel und jeder Thread hat eine eigene OpenCode-Session. Das
Standardverzeichnis ist `bot/`. Um die Website zu bearbeiten, in `bot/.env`
`OPENCODE_DIRECTORY=..` setzen oder bei `/ask` `directory:..` angeben.

### Konfiguration

Alle Werte stehen in `bot/.env` (siehe `bot/.env.example`).

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `DISCORD_TOKEN` | – | **Pflicht.** Bot-Token. |
| `DISCORD_GUILD_ID` | – | Guild für sofortige Command-Registrierung. |
| `DISCORD_ALLOWED_USERS` | alle | Kommagetrennte User-IDs, die den Bot nutzen dürfen. |
| `DISCORD_ALLOWED_CHANNELS` | alle | Kommagetrennte Channel-IDs, in denen der Bot reagiert. |
| `OPENCODE_URL` | lokaler Dienst | Entfernter OpenCode-Server, z. B. `http://127.0.0.1:4096`. |
| `OPENCODE_AUTH` | – | `user:passwort` für Basic Auth am entfernten Server. |
| `OPENCODE_TOKEN` | – | Bearer-Token für den entfernten Server. |
| `OPENCODE_DIRECTORY` | `bot/` | Standard-Arbeitsverzeichnis. |
| `OPENCODE_AGENT` | OpenCode-Standard | Standard-Agent, z. B. `build` oder `plan`. |
| `OPENCODE_MODEL` | OpenCode-Standard | Standardmodell als `provider/model`. |
| `OPENCODE_TIMEOUT_MS` | `1800000` | Maximale Laufzeit einer Aufgabe (30 min). |
| `STREAM_UPDATE_MS` | `1500` | Abstand der Live-Updates. Bei Rate-Limits erhöhen. |
| `STREAM_OUTPUT` | `true` | `false` deaktiviert die Live-Vorschau. |
| `STATE_FILE` | `.data/state.json` | Speicherort der Channel→Session-Zuordnung. |

### Sicherheit

> **Wichtig:** Der Bot gibt jedem, der ihn benutzen darf, indirekt Shell- und
> Dateizugriff auf das Arbeitsverzeichnis. Behandle ihn wie einen
> Remote-Zugang zu deinem Rechner.

- Setze mindestens `DISCORD_ALLOWED_USERS` **oder** `DISCORD_ALLOWED_CHANNELS`,
  wenn der Bot auf einem Server mit anderen Mitgliedern läuft.
- Der Discord-Token steht nur in `bot/.env` und wird nicht an OpenCode
  weitergegeben.

### Fehlerbehebung

- **„OpenCode-Dienst nicht erreichbar“** – `opencode service status`, ggf.
  `opencode service restart`, oder `OPENCODE_URL` setzen.
- **Slash-Commands erscheinen nicht** – ohne `DISCORD_GUILD_ID` dauert die
  globale Registrierung bis zu einer Stunde; mit
  `applications.commands`-Scope einladen und Bot neu starten.
- **Bot reagiert nicht auf @Erwähnungen** – Message Content Intent aktivieren.
- **„Unknown interaction“** – bei sehr langsamen Modellen
  `OPENCODE_TIMEOUT_MS` erhöhen, bei Rate-Limits `STREAM_UPDATE_MS`.

### Als systemd-User-Dienst

Fertige Unit: `~/.config/systemd/user/freistaat-bot.service` (nicht enabled).
Sie startet `node` direkt statt über `npm`, damit `SIGTERM` den Bot erreicht
und er den Discord-Client sauber schließt. Weil Node über **mise** installiert
ist, läuft `ExecStart` über `mise x node@26`; ohne mise genügt der absolute
Pfad zur Node-Binary, z. B. `/usr/bin/node src/index.js`.

```bash
systemctl --user daemon-reload
systemctl --user enable --now freistaat-bot
journalctl --user -u freistaat-bot -f
```

Voraussetzungen: `bot/.env` mit `DISCORD_TOKEN` liegt vor und
`node bot/src/index.js` startet im Terminal ohne Fehler.

```bash
systemctl --user status freistaat-bot    # Zustand prüfen
systemctl --user restart freistaat-bot   # nach Code-Änderungen
systemctl --user disable --now freistaat-bot
```

## Nächste Schritte

- Echte Stimmabgabe mit Discord-Login und Supabase
- Ergebnisse und Fristen serverseitig auswerten
- Bot um Befehle für Abstimmungen und Gesetzes-Überprüfung erweitern

