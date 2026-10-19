# Hosting-Setup: Freistaat

Stand: 2026-10-19

## 1. Überblick

```
GitHub  ──►  Vercel (Next.js, OAuth-Callback, Bot-HTTP-Endpoint)
                 │
                 ├──► Supabase (Postgres, Auth, Sessions)
                 └──► Discord API (Rollen, Slash-Commands, Ankündigungen)
```

Es wird **kein eigener Server** gebraucht. Alles läuft serverless.

## 2. Was du brauchst

| Dienst | Zweck | Pflicht? | Kosten |
|---|---|---|---|
| [GitHub](https://github.com) | Code, CI, Backups | ja | 0 € |
| [Vercel](https://vercel.com) Hobby | Hosting der App | ja | 0 € (nicht-kommerziell) |
| [Supabase](https://supabase.com) Free | Postgres + Auth | ja | 0 € |
| [Discord Developer Portal](https://discord.com/developers/applications) | OAuth-App + Bot | ja | 0 € |
| Domain (z. B. `.de`) | eigene Adresse | nein | ca. 10–20 €/Jahr |
| Railway/Fly.io | nur falls Bot als Dauerprozess | nein | 0–5 $/Monat |
| Sentry Free | Fehler-Tracking | nein | 0 € |

Ohne Domain läuft die Seite unter `freistaat.vercel.app` – für Discord völlig ausreichend.

## 3. Einrichtung in Reihenfolge

### Schritt 1: Discord-Application

1. Developer Portal → „New Application".
2. **General Information:** `Application ID` und `Public Key` notieren.
3. **OAuth2:** `Client Secret` erzeugen und notieren.
4. **OAuth2 → Redirects:** später die Supabase-Callback-URL eintragen:
   `https://<project-ref>.supabase.co/auth/v1/callback`
5. **Bot:** Bot anlegen, `Bot Token` notieren.
6. **Bot → Privileged Intents:** keine nötig (wir nutzen HTTP-Interactions und
   `guilds.members.read`).
7. **Bot Permissions:** `Manage Roles`, `Send Messages`, `Embed Links`.
8. Bot einladen (Scopes `bot`, `applications.commands`).
9. Im Server die Rollen **Bürger** und **Wahlleitung** anlegen; Rollen-IDs notieren
   (Discord → Einstellungen → Erweitert → Entwicklermodus).

**Wichtig bei „Manage Roles":** Die Bot-Rolle muss in der Rollenliste **über** den
Rollen stehen, die sie vergeben soll (Bürger, Gewählte).

### Schritt 2: Supabase

1. Neues Projekt anlegen, Region **Frankfurt (eu-central-1)**.
2. **Authentication → Providers → Discord:** Client ID und Secret eintragen.
3. **Authentication → URL Configuration:**
   - Site URL: `https://<deine-domain>`
   - Redirect URLs: `https://<deine-domain>/auth/callback`
4. **Project Settings → API:** URL, Publishable/Anon Key und Secret/Service-Role-Key
   notieren. Der Secret-Key darf **nur** serverseitig verwendet werden.
5. Migrationen einspielen (Schema aus `docs/scope.md`, Abschnitt 7).
6. RLS auf allen Tabellen aktivieren; Schreibzugriffe nur über Server-Routen.

**Free-Tier-Grenzen:** 500 MB DB, 50.000 Auth-User, 2 aktive Projekte,
**Pause nach 7 Tagen ohne DB-Aktivität**, **keine automatischen Backups**.

### Schritt 3: Vercel

1. GitHub-Repo importieren.
2. Framework: Next.js (automatisch erkannt).
3. Environment-Variablen setzen (Abschnitt 4), für Production **und** Preview.
4. Region auf `fra1` setzen (Nähe zu Supabase Frankfurt).
5. Deployen.
6. Danach die Deploy-URL als Discord-Interactions-Endpoint eintragen:
   `https://<deine-domain>/api/discord/interactions`
7. Slash-Commands einmalig registrieren (Script oder Route).

### Schritt 4: Domain (optional)

1. Domain kaufen.
2. In Vercel → Domains hinzufügen, DNS-Einträge beim Registrar setzen.
3. In Discord und Supabase die neue URL überall nachziehen.

### Schritt 5: Schutzmechanismen

1. **Keep-alive:** Vercel Cron (`0 3 * * *`) ruft `/api/cron/keepalive` auf, das
   eine triviale DB-Query macht. Verhindert das Supabase-Pausieren.
   Hobby-Cron läuft **nur einmal täglich** (UTC, ±1 h) – das reicht.
2. **Backup:** GitHub Action, die nächtlich `pg_dump` zieht und als Artifact oder
   in Cloudflare R2 ablegt. Supabase Free hat keine Backups.
3. **Cron-Secret:** Route mit `Authorization: Bearer $CRON_SECRET` schützen.
4. **Rate Limits** für Login, Unterschriften und Stimmabgabe.

## 4. Environment-Variablen

```env
# Öffentlich (dürfen in den Browser)
NEXT_PUBLIC_SITE_URL=https://deine-domain.de
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Server-only (niemals mit NEXT_PUBLIC_ prefixen)
SUPABASE_SECRET_KEY=sb_secret_...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_PUBLIC_KEY=...
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_CITIZEN_ROLE_ID=...
DISCORD_ADMIN_ROLE_ID=...
CRON_SECRET=...
```

Hinweis: Bei Supabase Auth liegt das Discord-Client-Secret in Supabase, nicht in
der App. Die App braucht es nur, wenn sie den OAuth-Flow selbst implementiert –
was sie nicht tut.

## 5. Kosten

| Posten | Monatlich | Jährlich |
|---|---|---|
| GitHub | 0 € | 0 € |
| Vercel Hobby | 0 € | 0 € |
| Supabase Free | 0 € | 0 € |
| Discord | 0 € | 0 € |
| Domain | – | 10–20 € |
| **Gesamt** | **0 €** | **10–20 €** |

Optional:
- Railway Hobby: 5 $/Monat (nur nötig, wenn der Bot als Gateway-Prozess läuft;
  mit HTTP-Interactions entfällt das).
- Supabase Pro: 25 $/Monat (nur bei Bedarf an Backups, kein Pausieren, mehr Speicher).

## 6. Grenzen und Stolperfallen

| Thema | Limit | Konsequenz |
|---|---|---|
| Supabase Pause | 7 Tage ohne DB-Query | Cron-Ping einrichten, sonst ist die Seite offline |
| Supabase Backups | Free: keine | eigener `pg_dump`-Job |
| Supabase DB | 500 MB | für diesen Anwendungsfall jahrelang ausreichend |
| Vercel Hobby | nicht-kommerziell, 100 GB Traffic | für einen Discord-Server unkritisch |
| Vercel Cron | 1×/Tag, UTC, ±1 h | reicht für Keep-alive und Wahlschluss |
| Vercel Function | 300 s max | Discord-Interaction muss in 3 s antworten → deferred response |
| Supabase Auth | 50.000 MAU | weit über jeder Discord-Server-Größe |
| Discord Interactions | 3 s Antwortzeit | sofort acken, danach Follow-up |
| Discord Rollen | Bot-Rolle muss oben stehen | sonst schlägt Rollenvergabe still fehl |
| Supabase Keys | Secret Key nur serverseitig | sonst kann jeder die DB schreiben |

## 7. Lokale Entwicklung

- `.env.local` mit denselben Variablen (nie committen).
- Supabase CLI für lokale DB und Migrationen (`supabase start`).
- Discord-Interactions lokal testen: Tunnel mit `cloudflared tunnel --url
  http://localhost:3000`, URL im Developer Portal eintragen. Alternativ Bot im
  Gateway-Modus lokal starten.
- OAuth-Redirect lokal: `http://localhost:3000/auth/callback` in Supabase erlauben.

## 8. Checkliste vor dem ersten Livegang

- [ ] Discord-App angelegt, Rollen „Bürger" und „Wahlleitung" existieren
- [ ] Bot eingeladen, Bot-Rolle über den Vergabe-Rollen
- [ ] Supabase-Projekt in EU, Discord-Provider aktiviert
- [ ] Redirect-URLs in Discord und Supabase identisch
- [ ] Schema + RLS eingespielt
- [ ] Vercel-Projekt verbunden, alle Env-Variablen gesetzt
- [ ] Interactions-Endpoint in Discord eingetragen und verifiziert
- [ ] Slash-Commands registriert
- [ ] Keep-alive-Cron aktiv
- [ ] Backup-Job aktiv
- [ ] Datenschutz + Impressum verlinkt
- [ ] Testwahl mit 3 Accounts durchgespielt
