# TODO

Stand: 25.10.2026

> **Regel:** Neue Features und Workflow-Änderungen zuerst im Testserver
> `freistaat test` testen, erst danach in `Freistaat` ausrollen.
> Details: `AGENTS.md`.

## Erledigt

### Zusammenführung mit dem Discord-Bot

- [x] Separates Verzeichnis `Freistaat/` (OpenCode-Discord-Bot) in dieses
      Repository übernommen, als Unterprojekt `bot/`
- [x] Eigene `package.json`/`package-lock.json` im Bot; Root-Skripte
      `bot:start`, `bot:dev`, `bot:doctor`, `test:bot`
- [x] `bot/.env` (aus `bot/.env.example`), Root-`.env` bleibt nur für `scripts/`
- [x] Bot-Engine auf Node `>=20.12.0` korrigiert (`process.loadEnvFile`)
- [x] `.gitignore`, `README.md`, `AGENTS.md` auf die neue Struktur umgestellt
- [x] Website-Build, Lint und beide Testsuiten nach dem Merge grün

### Website-Ausbau (25.10.2026)

- [x] Discord-Einladungslink `https://discord.gg/DDXsES9DG` zentral in
      `siteConfig.discordUrl`; verlinkt in Header, Mobile-Menü und Footer
- [x] SEO: `metadataBase`, OpenGraph/Twitter Cards, generiertes OG-Bild,
      `app/sitemap.ts` und `app/robots.ts`
- [x] `app/error.tsx` und `app/loading.tsx`
- [x] Status und Fristen werden aus den Daten abgeleitet (`lib/status.ts`);
      Seiten mit Fristen nutzen ISR (`revalidate = 300`)
- [x] Parteien-Detailseiten (`/parteien/[slug]`) und klickbare Parteikarten
- [x] Kandidatur, Parteigründung und Begehren-Einreichung klar als Demo
      gekennzeichnet; der tatsächliche Weg führt über Discord
- [x] CI-Workflow für Lint, Tests und Build (Website und Bot)
- [x] `npm audit`: 0 Schwachstellen – der alte Eintrag mit 5 hohen war veraltet
- [x] Impressum: Struktur nach § 5 DDG mit deutlich markierten Platzhaltern
- [x] Datenschutz: Erklärung für Hosting, Discord-Login, Stimmen,
      Unterschriften und lokale Demo-Daten

### Website & Deployment

- [x] Vercel-Projekt von „Other“ auf **Next.js** umgestellt
  (vorher `STATIC_BUILD_NO_OUT_DIR`, weil `public/` gesucht wurde)
- [x] Production-Deploy erfolgreich
- [x] Website live unter https://freistaat-dashboard.vercel.app
- [x] Alle Routen geprüft: Start, Wahlen, Begehren, Gesetze, Parteien inkl.
      Detailseiten, Profil, Impressum, Datenschutz, Sitemap, Robots und
      OG-Bild liefern 200; unbekannte Pfade 404
- [x] Vercel-Deploy nach dem letzten Gesetze-Sync geprüft – erfolgreich,
      Live-Seite zeigt die synchronisierten Texte

### Discord-Sync

- [x] Drei Gesetzes-Channels im Produktionsserver **Freistaat**:
      `#verfassung`, `#recht-und-ordnung`, `#verfügen`
- [x] Ein Channel pro Gesetzestext, eine Nachricht pro einzelnem Gesetz
      (29 + 6 + 3 Nachrichten)
- [ ] Optional: Übersichts-Channel im Produktionsserver anlegen und als
      `DISCORD_CHANNEL_ID` setzen (im Testserver existiert `#gestze`)
- [x] `DISCORD_GUILD_ID` als Repository-Variable gesetzt
- [x] Publish-Workflow ist idempotent
      (`content/discord-publish-state.json`)
- [x] Sync schreibt die Texte zurück nach `content/*.md` und
      `content/discord-channels.json`
- [x] `content/Gesetze.md` entfernt; die Website liest die drei Dateien direkt
- [x] Website zeigt die synchronisierten Texte mit Discord-Links
- [x] `README.md` an die neue Struktur angepasst

## Offen – Discord & Deployment

- [ ] Altes Secret `WEBHOOKURL` löschen, falls nicht mehr benötigt
- [ ] Entscheidung: Discord ist die Quelle, `content/*.md` ist der
      Sync-Snapshot. Künftige Gesetzesänderungen also in Discord vornehmen.
- [ ] Alte Attachment-Nachrichten in `#gestze` löschen, falls nicht als
      Archiv benötigt
- [ ] Vercel: **Production Branch** auf `master` prüfen bzw. das neueste
      Deployment promoten. Die Live-Domain zeigte zuletzt noch einen älteren
      Build, obwohl die Deployments erfolgreich waren.
- [ ] Optional: Vercel Deploy Hook als Secret `VERCEL_DEPLOY_HOOK` hinterlegen
      (die Workflows unterstützen ihn bereits).
- [ ] Test/Prod-Umschaltung vereinfachen: `law-documents.json` um
      `channels.test` / `channels.production` erweitern und einen
      Workflow-Input für die Umgebung ergänzen.

## Offen – Discord-Bot (`bot/`)

- [ ] Befehle für Gesetzes-Überprüfung im Bot ergänzen (im alten README
      angekündigt, in `src/` aber noch nicht umgesetzt)
- [ ] Bot als systemd-User-Dienst aktivieren (`freistaat-bot`, Unit liegt
      bereit, muss nur noch enabled werden – siehe `README.md`)
- [ ] Entscheiden, ob der Bot die Sync-Skripte aus `scripts/` aufrufen soll
      statt eigener Logik

## Offen – Website

- [ ] Impressum: echte Angaben (Name, Anschrift und Kontakt) einsetzen
- [ ] Datenschutz: rechtlich prüfen, Auftragsverarbeitungsverträge mit Vercel
      und Supabase abschließen und die Datenbankregion ergänzen
- [ ] Optional: `NEXT_PUBLIC_SITE_URL` in Vercel setzen, falls die Domain
      wechselt (Fallback ist die aktuelle Vercel-Domain)

## Supabase

### Erledigt (Code)

- [x] Schema, RLS, Trigger und Seed in
      `supabase/migrations/20261025000000_init.sql`
- [x] Tabellen für Parteien, Personen, Wahlen, Kandidaturen, Bürgerbegehren,
      Profile, Stimmen und veröffentlichte Ergebnisse
- [x] `lib/data.ts` liest Supabase und fällt ohne Konfiguration auf
      `lib/mock-data.ts` zurück
- [x] Discord-OAuth-Flow: `signInWithDiscord`, `/auth/callback` und
      Session-Refresh über `proxy.ts`
- [x] Profilseite mit Login, Logout, Stimmen und Unterschriften
- [x] `components/vote-form.tsx` speichert Stimmen per Server Action;
      eine Stimme pro Wahl, Trigger prüft Frist und Option
- [x] `components/initiative-sign.tsx` speichert Unterschriften per Server
      Action; Trigger prüft Frist und Schwelle
- [x] Ergebnisse: `published_results` plus admin-geschütztes
      `publish_election(...)`
- [x] RLS: öffentliche Inhalte lesbar, Profile/Stimmen/Unterschriften nur
      eigene, Schreiben nur für angemeldete Bürger
- [x] Migration gegen echtes Postgres getestet (24/24 Checks: Anon-Zugriff,
      RLS, eine Stimme, Fristen, Unterschriften, Admin-Publish)

### Manuell erledigt

- [x] Cloud-Projekt `zoialgaxexdfpjnohaza` und Migration ausgeführt
- [x] Discord als Provider aktiviert, Redirect-URLs in Discord und Supabase
- [x] Lokale `.env.local` mit Projekt-URL und Publishable Key
- [x] Login im Browser getestet; Profil wird angelegt (`citizen_count` steigt)

### Offen (manuell)

- [ ] Stimme und Unterschrift im Livebetrieb testen (letzter offener
      Funktionstest; laut Server-Log noch keine Server Action ausgelöst)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
      setzen und neu deployen
- [ ] Wahlleitung: eigenes Profil auf `role = 'admin'` setzen
- [ ] Discord-Rollenprüfung für „Bürger“ (aktuell darf jedes angemeldete Konto
      wählen)
- [ ] Admin-Oberfläche für Fristen, Kandidaturen und Ergebnisveröffentlichung
      (aktuell SQL/Table Editor)
- [ ] Optional: Bot postet Links zu offenen Abstimmungen

