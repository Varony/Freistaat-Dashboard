# TODO

Stand: 23.10.2026

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

- [x] Drei Gesetzes-Channels: `#verfassung`, `#recht-und-ordnung`,
      `#verfügungen`
- [x] Ausgangstexte nach Discord veröffentlicht (29 + 6 + 3 Gesetze)
- [x] Übersichts-Channel `#gestze` verlinkt die Gesetzes-Channels
- [x] `DISCORD_GUILD_ID` als Repository-Variable gesetzt
- [x] Sync schreibt die Texte zurück nach `content/*.md` und
      `content/discord-channels.json`
- [x] `content/Gesetze.md` entfernt; die Website liest die drei Dateien direkt
- [x] Website zeigt die synchronisierten Texte mit Discord-Links

## Offen – Discord & Deployment

- [ ] `README.md` an die neue Struktur anpassen
      (kein `content/Gesetze.md` mehr, `sync-laws-from-discord.mjs`)
- [ ] Altes Secret `WEBHOOKURL` löschen, falls nicht mehr benötigt
- [ ] Entscheiden, ob künftige Gesetzesänderungen nur in Discord oder auch in
      `content/*.md` gepflegt werden

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
