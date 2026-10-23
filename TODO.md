# TODO

## Discord-Bot für den Gesetze-Sync

Der Sync ist aktiv: GitHub Actions liest den Gesetzblatt-Channel alle
15 Minuten und schreibt `content/Gesetze.md`. Der Bot-Token liegt in den
Repository-Secrets.

- [x] Workflow-Zeitplan aktiviert
- [x] Markdown-Format an `lib/laws.ts` angepasst (`##`-Abschnitte)
- [x] Discord-Links pro Gesetz und zum Channel
- [ ] Prüfen, ob `DISCORD_CHANNEL_ID` in den Secrets gesetzt ist
- [ ] Prüfen, ob der **Message Content Intent** im Developer Portal aktiv ist
- [ ] Workflow mit `dry_run = true` starten und Ausgabe prüfen
- [ ] Workflow ohne Dry-Run starten und `content/Gesetze.md` prüfen
- [ ] Alte Webhook-Secrets entfernen (`DISCORD_WEBHOOK_URL` / `WEBHOOKURL`)
- [ ] Vercel-Deploy nach dem Sync prüfen

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
- [ ] Entscheiden, ob der Discord-Sync die drei manuellen Texte ersetzen oder ergänzen soll
- [ ] Discord-Anhänge dauerhaft speichern (CDN-Links können ablaufen)
- [ ] Alte Webhook-Dokumentation aus der Git-Historie entfernen, falls nicht mehr benötigt
