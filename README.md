# Freistaat

Website für eine Demokratie-Simulation im Discord: Wahlen, Bürgerbegehren,
Gesetze und Parteien an einem Ort.

Aktueller Stand: **klickbarer Prototyp mit Beispieldaten**. Das Gesetzblatt
wird bereits automatisch aus Discord synchronisiert. Anmeldung und echte
Stimmabgabe fehlen noch; die übrigen Daten liegen in `lib/mock-data.ts`.

## Entwicklung

```bash
npm install
npm run dev
```

Öffne http://localhost:3000.

```bash
npm run build   # Produktionsbuild
npm run lint    # ESLint
npm test        # Tests für den Discord-Sync
```

## Discord-Sync

Die Gesetze liegen in drei Discord-Channels:

- `#verfassung` – Verfassung des Freistaates
- `#recht-und-ordnung` – Recht und Ordnung
- `#verfügungen` – Einstweilige Verfügungen

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
| `DISCORD_CHANNEL_ID` | Variable | Übersichts-Channel `#gestze` |
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
  Einstweilige Verfügungen.md     aus #verfügungen generiert
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
```

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

## Nächste Schritte

- Echte Stimmabgabe mit Discord-Login und Supabase
- Ergebnisse und Fristen serverseitig auswerten
- Optional: Bot postet Links zu offenen Abstimmungen und Ergebnisse
