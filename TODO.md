# TODO

Stand: 23.10.2026

> **Regel:** Neue Features und Workflow-Änderungen zuerst im Testserver
> `freistaat test` testen, erst danach in `Freistaat` ausrollen.
> Details: `AGENTS.md`.

## Erledigt

### Website & Deployment

- [x] Vercel-Projekt von „Other“ auf **Next.js** umgestellt
  (vorher `STATIC_BUILD_NO_OUT_DIR`, weil `public/` gesucht wurde)
- [x] Production-Deploy erfolgreich
- [x] Website live unter https://freistaat-dashboard.vercel.app
- [x] Alle Routen geprüft: Start, Wahlen, Begehren, Gesetze, Parteien,
      Profil, Impressum, Datenschutz liefern 200; unbekannte Pfade 404
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

## Offen – Website vervollständigen

- [ ] Discord-Einladungslink eintragen (`siteConfig.discordUrl` ist `"#"`) und
      in Header/Footer verlinken
- [ ] Impressum: echte Angaben statt Platzhalter
- [ ] Datenschutz: vollständige Erklärung für den Livebetrieb
- [ ] SEO: `metadataBase`, OpenGraph/Twitter Cards, `sitemap.ts`, `robots.ts`
- [ ] `error.tsx` und `loading.tsx` ergänzen
- [ ] Status und Fristen dynamisch aus den Daten ableiten
      (Mock-Status veraltet sonst)
- [ ] Parteien-Detailseiten und klickbare Parteikarten
- [ ] Kandidatur, Parteigründung und Begehren-Einreichung: echte Flows oder
      klar als Demo kennzeichnen
- [ ] CI für Lint, Tests und Build einrichten
- [ ] `npm audit` prüfen (aktuell 5 hohe Schwachstellen)

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
