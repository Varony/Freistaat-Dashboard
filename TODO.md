# TODO

## Discord-Bot für den Gesetze-Sync

Der Sync ist aktiv: GitHub Actions liest den Gesetzblatt-Channel (`#gestze`)
alle 15 Minuten und schreibt `content/Gesetze.md`. Der Bot-Token liegt im
Secret `BOTTOKEN`, die Channel-ID in der Repository-Variable
`DISCORD_CHANNEL_ID`.

- [x] Workflow-Zeitplan aktiviert
- [x] Markdown-Format an `lib/laws.ts` angepasst (`##`-Abschnitte)
- [x] Discord-Links pro Gesetz und zum Channel
- [x] `DISCORD_CHANNEL_ID` als Repository-Variable gesetzt
- [x] Message Content Intent funktioniert
- [x] Workflow mit `dry_run = true` geprüft
- [x] Workflow ohne Dry-Run ausgeführt
- [x] `content/Gesetze.md` enthält die drei Gesetze
- [x] Drei Ausgangstexte über `publish-laws.yml` in den Channel gepostet
- [ ] Vercel-Deploy nach dem Sync prüfen
- [ ] Altes Secret `WEBHOOKURL` entfernen, falls nicht mehr benötigt

## Echte Abstimmungen (Supabase)

- [ ] Supabase-Projekt anlegen
- [ ] Discord OAuth in Supabase konfigurieren
- [ ] Tabellen für Wahlen, Kandidaten, Stimmen und Bürgerbegehren anlegen
- [ ] Next.js-Session/Login einbauen
- [ ] `components/vote-form.tsx` von `localStorage` auf Server Actions umstellen
- [ ] Ergebnisse und Fristen serverseitig auswerten
- [ ] Row Level Security: eine Stimme pro User und Wahl
- [ ] Bot postet Links zu offenen Abstimmungen (optional)

## Offen

- [x] Bestehende `content/*.md` als Fallback für die Website einbinden
- [x] Discord-Sync übernimmt die drei Gesetzestexte
- [x] Gesetzestexte werden aus den Anhängen ins Repository übernommen
- [ ] Entscheiden, ob künftige Gesetzesänderungen nur in Discord oder auch in `content/*.md` gepflegt werden
- [ ] Alte Webhook-Dokumentation aus der Git-Historie entfernen, falls nicht mehr benötigt
