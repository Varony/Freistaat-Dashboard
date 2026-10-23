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

Der Gesetzblatt-Channel wird alle 15 Minuten von GitHub Actions gelesen. Das
Skript erzeugt daraus `content/Gesetze.md`; jede menschliche Nachricht im
Channel wird ein `##`-Abschnitt mit Discord-Link und Beschlussdatum. Vercel
baut die Website nach dem Commit automatisch neu.

Solange `content/Gesetze.md` noch nicht existiert, zeigt die Website die drei
manuell gepflegten Texte aus `content/`:

- `Verfassung des Freistaates.md`
- `Recht und Ordnung.md`
- `Einstweilige Verfügungen.md`

Sobald die Datei aus dem Discord-Sync vorhanden ist, hat sie Vorrang.

Benötigte Repository-Secrets:

| Secret | Bedeutung |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Token des Discord-Bots |
| `DISCORD_CHANNEL_ID` | ID des Gesetzblatt-Channels |

Der Bot benötigt im Channel die Rechte **Channel ansehen** und
**Nachrichtenverlauf lesen**. Im Developer Portal muss der **Message Content
Intent** aktiviert sein.

Manuell testen:

1. GitHub → **Actions** → **Gesetze aus Discord** → **Run workflow**
2. Zuerst mit `dry_run = true` starten und die Ausgabe prüfen.
3. Danach ohne Dry-Run starten; der Workflow committet `content/Gesetze.md`.

Lokal testen (Token nur in der lokalen `.env`, nicht committen):

```bash
cp .env.example .env
# DISCORD_BOT_TOKEN und DISCORD_CHANNEL_ID eintragen
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
  laws.ts            parst content/Gesetze.md, Fallback auf Beispieldaten
  types.ts           Datentypen
content/
  Verfassung des Freistaates.md
  Recht und Ordnung.md
  Einstweilige Verfügungen.md   manuell gepflegte Gesetzestexte
  Gesetze.md                    optional: aus Discord erzeugt, hat Vorrang
scripts/
  sync-from-discord.mjs  Discord-Channel → Markdown
.github/workflows/
  sync-gesetze-from-discord.yml  Zeitplan und Commit
test/
  discord-sync.test.mjs  Tests für die Markdown-Erzeugung
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
