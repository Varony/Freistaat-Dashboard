# AGENTS.md

## Entwicklungsregeln

### Test vor Produktion

Neue Features, Workflow-Änderungen und Bot-Anpassungen werden **zuerst im
Testserver** getestet. Niemals ungetestet direkt im Produktionsserver
ausrollen.

| Umgebung | Server | Guild-ID |
| --- | --- | --- |
| Test | `freistaat test` | `1561751762426273892` |
| Produktion | `Freistaat` | `1551691741541830768` |

Ablauf für Discord-/Sync-Änderungen:

1. `DISCORD_GUILD_ID` auf den Testserver setzen.
2. In `law-documents.json` die Test-Channel-Namen verwenden:
   - `verfassung`
   - `recht-und-ordnung`
   - `verfügungen` (Produktion: `verfügen`)
3. Publish zuerst mit `dry_run = true`, dann echt im Testserver ausführen.
4. Sync mit `dry_run = true`, dann echt ausführen.
5. Im Testserver und in `content/*.md` prüfen:
   - Nachrichtenzahl (aktuell 29 + 6 + 3)
   - Idempotenz (zweiter Publish-Lauf: `Keine Änderung`)
   - Links und Dateiinhalte
6. Erst danach auf Produktion umstellen:
   - `DISCORD_GUILD_ID` = `1551691741541830768`
   - `law-documents.json` → `verfügen`
   - Publish/Sync erneut ausführen.

### Wichtige Dateien

- `law-documents.json` – Dokument → Channel → Datei
- `content/discord-publish-state.json` – Nachrichten-IDs für idempotentes Publish
- `content/discord-channels.json` – Channel-Links für die Website
- `.github/workflows/publish-laws.yml` – Markdown → Discord
- `.github/workflows/sync-laws-from-discord.yml` – Discord → Markdown

### Vercel

Die Live-Domain zeigt nur dann neue Inhalte, wenn der Vercel-Production-Branch
auf `master` steht oder ein Deploy Hook (`VERCEL_DEPLOY_HOOK`) ausgelöst wird.
