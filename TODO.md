# TODO

## Discord-Bot für den Gesetze-Sync (pausiert)

Der Bot-basierte Sync (Discord → `content/Gesetze.md`) ist vorbereitet, aber
deaktiviert. Der Workflow läuft derzeit nur manuell.

- [ ] Discord-Bot im Developer Portal anlegen bzw. öffnen
- [ ] Bot-Token erzeugen und kopieren
- [ ] **Message Content Intent** aktivieren (Bot → Privileged Gateway Intents)
- [ ] Bot in den Server einladen
  - [ ] Recht „Channel ansehen"
  - [ ] Recht „Nachrichtenverlauf lesen"
- [ ] Bot im Redaktions-Channel freischalten
- [ ] Channel-ID kopieren (Entwicklermodus → Rechtsklick → Channel-ID)
- [ ] Repository-Secrets setzen
  - [ ] `DISCORD_BOT_TOKEN`
  - [ ] `DISCORD_CHANNEL_ID`
- [ ] Im Workflow `.github/workflows/sync-gesetze-from-discord.yml` den
      `schedule`-Block einkommentieren
- [ ] Workflow mit `dry_run = true` starten und Ausgabe prüfen
- [ ] Workflow ohne Dry-Run starten und `content/Gesetze.md` prüfen
- [ ] Alte Webhook-Nachrichten im Channel aufräumen (optional)

## Offen

- [ ] Entscheiden, ob der alte Webhook-Sync (`.md` → Discord) bis zur
      Bot-Einrichtung wiederhergestellt werden soll
- [ ] Nach dem Bot-Setup: `DISCORD_WEBHOOK_URL` / `WEBHOOKURL` aus den Secrets
      entfernen (werden dann nicht mehr benötigt)

## Referenzen

- Ablauf und Grenzen: `docs/discord-sync.md`
- Workflow: `.github/workflows/sync-gesetze-from-discord.yml`
- Skript: `scripts/sync-from-discord.mjs`
