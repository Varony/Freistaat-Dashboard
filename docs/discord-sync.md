# Discord-Sync: Gesetze

Stand: 2026-10-19

## Zweck

`content/Gesetze.md` ist die Quelle. Jeder Abschnitt der Ebene 2 (`## ...`) wird
zu einer Discord-Nachricht. Bei Änderungen wird die bestehende Nachricht
bearbeitet – der Channel bleibt eine aufgeräumte Pinnwand, ohne Spam.

Es wird **kein Bot und kein Server** benötigt, nur ein Discord-Webhook.

## Einmalige Einrichtung

1. Im Ziel-Channel: **Channel bearbeiten → Integrationen → Webhooks → Neuer
   Webhook**. Namen z. B. „Gesetzblatt" setzen und die **Webhook-URL kopieren**.
2. Im GitHub-Repository: **Settings → Secrets and variables → Actions → New
   repository secret**
   - Name: `DISCORD_WEBHOOK_URL`
   - Wert: die kopierte URL
3. Änderung an `content/Gesetze.md` committen. Der Workflow läuft automatisch.

Der Webhook postet unter eigenem Namen. Er kann nur Nachrichten bearbeiten und
löschen, die er selbst erstellt hat – das ist für diesen Zweck genau richtig.

## Dateiformat

```md
# Gesetzblatt des Freistaats

> Einleitung. Alles vor dem ersten `##` wird zur ersten Nachricht.

## § 1 – Geltungsbereich

Text des Abschnitts.

## § 2 – Wahlrecht

Text des Abschnitts.
```

### Stabile IDs (optional)

Standardmäßig wird die ID aus der Überschrift gebildet. Wird eine Überschrift
umbenannt, gilt der Abschnitt als gelöscht und neu – die Nachricht wird also
gelöscht und unten neu angelegt.

Wer das vermeiden will, setzt direkt unter die Überschrift eine ID:

```md
## § 2 – Wahlrecht
<!-- id: wahlrecht -->
```

Die ID bleibt beim Umbenennen erhalten, die Nachricht wird nur editiert.

## Verhalten

| Änderung in der Datei | Ergebnis in Discord |
|---|---|
| Neuer `##`-Abschnitt | Neue Nachricht am Ende |
| Geänderter Text | Bestehende Nachricht wird editiert |
| Abschnitt gelöscht | Nachricht wird gelöscht |
| Überschrift umbenannt | Alte Nachricht gelöscht, neue angelegt (außer mit `id`) |
| Abschnitt länger als 1900 Zeichen | Wird auf mehrere Nachrichten verteilt; beim Kürzen werden überzählige gelöscht |

## Manuell auslösen

**Actions → Discord-Sync Gesetze → Run workflow**

- `dry_run`: zeigt nur an, was passieren würde
- `force`: schreibt alle Abschnitte neu, auch unveränderte

## Grenzen

- **2000 Zeichen** pro Discord-Nachricht. Der Sync teilt automatisch bei 1900.
- **Keine Tabellen:** Discord rendert Markdown-Tabellen nicht. Für Tabellen
  besser Code-Blöcke oder Listen verwenden.
- **Überschriften:** `#`, `##`, `###` werden von Discord als Überschriften
  dargestellt.
- **Erwähnungen sind deaktiviert** (`allowed_mentions: []`), damit ein
  `@everyone` im Gesetzestext keinen Ping auslöst.
- **Rate Limit:** zwischen Nachrichten wird 600 ms gewartet (Webhook-Limit:
  5 Requests / 2 Sekunden).
- **Nur ein Webhook pro Channel:** Der State enthält die Message-IDs. Wird der
  Webhook gelöscht, sind die alten Nachrichten nicht mehr editierbar.

## State-Datei

`.discord-sync/gesetze.json` speichert pro Abschnitt einen Hash und die
Discord-Message-IDs. Die Datei wird vom Workflow automatisch committet.

**Nicht löschen.** Ohne sie weiß der Sync nicht, welche Nachricht zu welchem
Abschnitt gehört, und würde Duplikate anlegen.

## Lokal testen

```bash
DRY_RUN=1 node scripts/sync-discord.mjs

# mit echtem Webhook
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." node scripts/sync-discord.mjs
```

## Datei umbenennen

Wenn die Datei nicht `content/Gesetze.md` heißen soll:

1. Datei umbenennen.
2. In `.github/workflows/sync-gesetze.yml` den `paths`-Eintrag anpassen.
3. `SYNC_FILE` und `SYNC_STATE` im Workflow setzen (oder die Defaults im Script
   ändern).
