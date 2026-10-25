# AGENTS.md

## Entwicklungsregeln

### Test vor Produktion

Neue Features, Workflow-Änderungen und Bot-Anpassungen werden **zuerst im
Testserver** getestet. Niemals ungetestet direkt im Produktionsserver
ausrollen.

Auch für den Bot (Ordner `bot/`) gilt: Zuerst mit der Test-Guild-ID
(`DISCORD_GUILD_ID=1561751762426273892` in `bot/.env`) prüfen, dann auf
Produktion umstellen.

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

### Projektaufbau

Ein Repository, zwei Anwendungen:

| Ordner | Inhalt | Deploy |
| --- | --- | --- |
| `app/`, `components/`, `lib/`, `content/` | Website (Next.js) | Vercel, aus der Wurzel |
| `bot/` | Discord-Bot (OpenCode-Bridge, Node.js) | eigener Prozess/Service |

Der Bot ist ein Unterprojekt mit **eigener `package.json`** und eigenen
Abhängigkeiten (`discord.js`, `@opencode/client`). Er hat eigene Tests
(`bot/test/`) und wird getrennt gestartet:

```bash
npm run bot:doctor   # Verbindung zu OpenCode und Discord prüfen
npm run bot:start    # Bot starten
npm run bot:dev      # Neustart bei Änderungen
npm run test:bot     # Bot-Tests
```

Die Bot-Konfiguration liegt in `bot/.env` (Vorlage: `bot/.env.example`). Die
Token in der Wurzel-`.env` gelten nur für die Sync-Skripte in `scripts/`.

Wichtig: Der Bot arbeitet standardmäßig mit `bot/` als Arbeitsverzeichnis
für OpenCode. Um die Website zu bearbeiten, `OPENCODE_DIRECTORY=..` setzen
oder bei `/ask` `directory:..` angeben.

### Vercel

Die Live-Domain zeigt nur dann neue Inhalte, wenn der Vercel-Production-Branch
auf `master` steht oder ein Deploy Hook (`VERCEL_DEPLOY_HOOK`) ausgelöst wird.
