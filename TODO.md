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
- [x] Datenschutz: Erklärung für den aktuellen Prototyp (Hosting,
      `localStorage`, Discord-Links)

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
- [ ] Datenschutz: rechtlich prüfen, Auftragsverarbeitungsvertrag mit Vercel
      abschließen und die Erklärung vor Discord-Login/Supabase erweitern
- [ ] Optional: `NEXT_PUBLIC_SITE_URL` in Vercel setzen, falls die Domain
      wechselt (Fallback ist die aktuelle Vercel-Domain)

## Echte Abstimmungen (Supabase)

- [ ] Supabase-Projekt anlegen
- [ ] Discord OAuth in Supabase konfigurieren
- [ ] Tabellen für Wahlen, Kandidaten, Stimmen und Bürgerbegehren anlegen
- [ ] Next.js-Session/Login einbauen
- [ ] `components/vote-form.tsx` von `localStorage` auf Server Actions umstellen
- [ ] `components/initiative-sign.tsx` serverseitig speichern
- [ ] Ergebnisse und Fristen serverseitig auswerten
- [ ] Row Level Security: eine Stimme pro User und Wahl
- [ ] Bot postet Links zu offenen Abstimmungen (optional)
