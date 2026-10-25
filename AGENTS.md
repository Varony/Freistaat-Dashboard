# AGENTS.md

## Aufbau

Ein Repository, zwei Anwendungen – **kein npm-Workspace**:

| Pfad | Inhalt | Betrieb |
| --- | --- | --- |
| Wurzel: `app/`, `components/`, `lib/` | Website (Next.js 16, React 19) | Vercel, Production-Branch `master` |
| `bot/` | Discord-Bot (OpenCode-Bridge), eigene `package.json` | eigener Prozess |

`npm install` in der Wurzel installiert **nicht** die Bot-Abhängigkeiten.
Dafür `npm install --prefix bot` (eigene `bot/package-lock.json`).

## Befehle

```bash
npm run dev          # Website auf http://localhost:3000
npm run build        # Produktionsbuild
npm run lint         # ESLint, deckt auch bot/ ab
npm test             # Tests der Sync-Skripte (offline, kein Token nötig)
npm run test:bot     # Tests des Bots
npx tsc --noEmit     # Typecheck (es gibt kein eigenes Skript)

node --test test/law-documents.test.mjs   # einzelne Testdatei
node --test bot/test/format.test.js
```

`.github/workflows/ci.yml` prüft die Website (Lint, Tests, Build) und den Bot
(Tests).

## Gesetze und `content/`

- `content/*.md` wird aus Discord generiert; die Kopfzeile sagt „Nicht direkt
  bearbeiten“. Quelle der Wahrheit ist Discord, nicht die Datei.
- Änderung: in Discord bearbeiten → Sync (`npm run sync:discord` oder
  Workflow) → Ergebnis committen. Markdown nicht von Hand patchen.
- `law-documents.json` = Dokument → Channel → Datei + Trennregel
  (`headings` / `paragraphs` / `numbered`). Der Channel-Name dort schaltet
  zwischen Test und Produktion.
- `lib/laws.ts` liest `content/` zur Build-Zeit; alle Seiten sind statisch.
  Ohne neuen Build/Deploy ist eine Gesetzesänderung nicht sichtbar.
- Der Sync-Workflow läuft alle 15 Minuten und committet Änderungen nach
  `master`. Vor dem Push `git pull --rebase`; offene Änderungen an `content/`
  kollidieren sonst.
- `content/discord-publish-state.json` hält die Message-IDs, damit Publish
  idempotent bleibt. Nicht löschen, sonst werden Nachrichten dupliziert.
- Zwei Token-Namen: Sync-Skripte = `DISCORD_BOT_TOKEN` (Root-`.env`, vorher
  aus `.env.example` anlegen), Bot = `DISCORD_TOKEN` (`bot/.env`).
- Übersichts-Channel: Der Workflow liest die Repository-Variable
  `DISCORD_CHANNEL_ID`; lokal heißt die Env-Variable `DISCORD_INDEX_CHANNEL_ID`.

## Test vor Produktion

Neue Features, Workflow-Änderungen und Bot-Anpassungen **zuerst im Testserver**
testen, nie ungetestet auf Produktion.

| Umgebung | Server | Guild-ID |
| --- | --- | --- |
| Test | `freistaat test` | `1561751762426273892` |
| Produktion | `Freistaat` | `1551691741541830768` |

1. `DISCORD_GUILD_ID` auf den Testserver setzen (Bot: `bot/.env`, Workflows:
   Repository-Variable, lokal: Root-`.env`).
2. In `law-documents.json` die Test-Channel-Namen eintragen:
   `verfassung`, `recht-und-ordnung`, `verfügungen`
   (Produktion: `verfügen`).
3. Publish zuerst mit `dry_run = true`, dann echt.
4. Sync zuerst mit `dry_run = true`, dann echt.
5. Prüfen: 29 + 6 + 3 Nachrichten, der zweite Publish-Lauf meldet „Keine
   Änderung“, Links und `content/*.md` stimmen.
6. Erst dann Produktion: Guild-ID `1551691741541830768`,
   `law-documents.json` → `verfügen`, Publish/Sync erneut.

## Bot (`bot/`)

- Eigene `package.json`, eigene Tests, eigenes `bot/.env`. `bot/src/config.js`
  lädt die Datei selbst; die Root-`.env` gilt nur für `scripts/`.
- Root-Skripte: `npm run bot:doctor` (OpenCode + Discord prüfen),
  `npm run bot:start`, `npm run bot:dev`.
- Standard-Arbeitsverzeichnis von OpenCode ist `bot/`. Für Arbeit an der
  Website `OPENCODE_DIRECTORY=..` setzen oder `/ask directory:..` nutzen.
- Der Bot ist ein Remote-Shell-Zugang: `DISCORD_ALLOWED_USERS` oder
  `DISCORD_ALLOWED_CHANNELS` setzen.
- Node ≥ 20.12 nötig (`process.loadEnvFile`).
- systemd: Unit `freistaat-bot` liegt bereit, ist aber nicht enabled; Details
  in `bot/README.md`.

## Website

- Tailwind 4 ohne `tailwind.config.js` und ohne PostCSS: `next.config.ts`
  lädt `@tailwindcss/turbopack`. Design-Tokens stehen in `app/globals.css`
  (`:root` + `@theme inline`); Klassen wie `bg-bg`, `text-muted`,
  `border-border`, `rounded-card` hängen daran.
- Supabase ist optional. Ohne `NEXT_PUBLIC_SUPABASE_URL` und
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` kommen die Inhalte aus `lib/mock-data.ts`
  und Stimmen/Unterschriften bleiben im `localStorage`. Mit Konfiguration
  liest `lib/data.ts` aus Supabase; Auth und Schreibzugriffe laufen über
  `lib/supabase/` und Server Actions.
- Schema, RLS, Trigger und Seed stehen in
  `supabase/migrations/20261025000000_init.sql`; die Einrichtung inklusive
  Discord-OAuth steht in `supabase/README.md`. Niemals den service_role key
  verwenden oder als `NEXT_PUBLIC_*` setzen.
- Status und Fristen kommen aus `lib/status.ts`, nicht aus einem
  gespeicherten Statusfeld. `results_public` entscheidet über
  „veröffentlicht“. Übersichtsseiten nutzen ISR (`revalidate = 300`),
  Wahl-/Begehren-Details und `/profil` sind dynamisch.
- `proxy.ts` (Next 16, nicht `middleware.ts`) erneuert die Session. Server
  Actions prüfen Auth und Rechte trotzdem selbst.
- Kandidatur, Parteigründung und Begehren-Einreichung sind bewusst Demo und
  müssen so gekennzeichnet bleiben. Supabase deckt Login, Stimmen und
  Unterschriften ab, nicht diese Anträge.
- Kanonische URL: `NEXT_PUBLIC_SITE_URL`, Fallback ist die Vercel-Domain
  (`lib/site-config.ts`).
- Oberfläche ist deutsch; neue Texte ebenfalls.

## Commits

Änderungen werden **sofort automatisch committet**, ohne Rückfrage:

- Jede abgeschlossene, funktionierende Änderung bekommt einen eigenen Commit.
  Immer die eigenen Änderungen committen, nie fremde unfertige Dateien
  mitnehmen (`git status` vorher prüfen, gezielt stagen).
- Vor dem Commit die passenden Prüfungen laufen lassen: `npm run lint`,
  `npm test`, `npm run test:bot`, `npx tsc --noEmit`; bei UI-Änderungen
  zusätzlich `npm run build`.
- Ausnahme: Wenn eine Prüfung fehlschlägt, nicht committen, sondern den Fehler
  beheben.
- Commit-Messages nach Conventional Commits auf Englisch wie `git log`.
- Kein `git push`: Der Push auf `master` löst direkt Vercel-Deploys und die
  laufende Sync-Historie aus. Push nur, wenn ausdrücklich verlangt.

## Deployment

Vercel baut aus der Wurzel. Die Live-Domain aktualisiert nur, wenn der
Production-Branch `master` ist oder `VERCEL_DEPLOY_HOOK` ausgelöst wird.
Die Workflows committen direkt nach `master` und lösen damit Deploys aus.
Commit-Messages folgen Conventional Commits auf Englisch (`git log`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
