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

## Dauerbetrieb

Ein Webhook ist ein **passiver Endpunkt** – er „läuft" nicht und kann nicht
abstürzen. Stabil bleiben müssen drei Dinge:

1. **Der Webhook existiert** (Channel nicht gelöscht, Webhook nicht entfernt).
2. **Das Secret ist gesetzt** (`DISCORD_WEBHOOK_URL`).
3. **Der Workflow wird ausgelöst** (Push oder Zeitplan).

### Was automatisch abgesichert ist

- **Täglicher Abgleich:** Der Workflow läuft zusätzlich um 04:00 UTC. Falls ein
  Push-Event verloren geht, holt der Lauf die Änderung nach. Unveränderte
  Abschnitte werden übersprungen (Hash-Vergleich), es entsteht kein Spam.
- **Gelöschte Nachrichten:** Wurde eine Nachricht manuell in Discord gelöscht,
  erkennt der Sync das (HTTP 404) und postet sie beim nächsten Lauf neu.
- **Rate Limits und Discord-Ausfälle:** 429 wird mit `retry_after` abgewartet,
  5xx und Netzwerkfehler werden mit Backoff bis zu fünfmal wiederholt.
- **Health-Check:** Vor jedem Lauf wird geprüft, ob der Webhook überhaupt
  existiert. Ist er weg, schlägt der Lauf mit einer klaren Meldung fehl.
- **Aufräumen:** Abschnitte, die aus der Datei entfernt wurden, werden auch in
  Discord gelöscht; überzählige Nachrichten nach dem Kürzen eines Abschnitts
  ebenfalls.

### Fehler bemerken

- GitHub benachrichtigt dich per E-Mail, wenn ein Workflow fehlschlägt
  (Einstellungen → Notifications → Actions).
- Optional: Lege einen zweiten Webhook in einem **anderen** Channel an und
  speichere ihn als Secret `DISCORD_ALERT_WEBHOOK_URL`. Bei einem Fehler postet
  der Workflow dort einen Link zum fehlgeschlagenen Lauf. Ein zweiter Channel
  ist wichtig, weil der Haupt-Webhook ja gerade defekt sein kann.

### Wenn der Webhook ersetzt werden muss

1. Neuen Webhook im Channel anlegen.
2. Secret `DISCORD_WEBHOOK_URL` aktualisieren.
3. Workflow mit `force = true` starten.
4. Die alten Nachrichten des gelöschten Webhooks manuell in Discord entfernen –
   der neue Webhook kann sie nicht bearbeiten oder löschen.

### Grenzen von GitHub Actions

- **60 Tage Inaktivität:** In öffentlichen Repos deaktiviert GitHub Zeitplan-
  Workflows nach 60 Tagen ohne Repository-Aktivität. Push-Auslöser sind davon
  nicht betroffen; ein einziger Push reaktiviert den Zeitplan.
- **Free-Kontingent:** 2.000 Minuten/Monat bei privaten Repos, öffentliche Repos
  sind kostenlos. Ein Sync-Lauf dauert ca. 15 Sekunden.
- **Kein garantierter Zeitpunkt:** Geplante Läufe starten mit Verzögerung
  (Minuten bis wenige Stunden). Für diesen Anwendungsfall unkritisch.

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
