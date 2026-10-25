# Supabase

Die Website nutzt Supabase für Discord-Login, Stimmen und Unterschriften.
Ohne `NEXT_PUBLIC_SUPABASE_*` läuft sie unverändert mit den Mock-Daten und
lokalen Demo-Stimmen weiter.

## 1. Projekt und Zugangsdaten

In `.env.local` (lokal) und bei Vercel eintragen:

| Variable | Bedeutung |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Projekt-URL, z. B. `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher anon key aus **Project Settings → API** |
| `NEXT_PUBLIC_SITE_URL` | Kanonische Website-URL (optional, Fallback ist die Vercel-Domain) |

Der **service_role key wird nicht verwendet** und darf weder ins Repository
noch in eine `NEXT_PUBLIC_*`-Variable.

## 2. Schema und Seed

`supabase/migrations/20261025000000_init.sql` im **Supabase SQL Editor**
ausführen. Die Migration legt an:

- `parties`, `people`, `elections`, `candidacies`
- `initiatives`, `initiative_signatures`
- `profiles`, `votes`, `published_results`, `site_settings`
- RLS-Policies, Trigger, die Aggregat-Views `initiative_overview` und
  `citizen_count`
- Seed-Daten aus dem bisherigen Mock-Bestand (3 Parteien, 5 Wahlen,
  4 Bürgerbegehren, historisches Gerichtshof-Ergebnis)

`base_citizens` (24) und `base_signatures` bilden die bisherigen
Simulationszahlen ab. Echte Konten und Stimmen kommen additiv hinzu.

## 3. Discord-Login einrichten

1. **Discord Developer Portal** → deine bestehende Anwendung → **OAuth2** →
   **Redirects** hinzufügen:
   `https://<projekt-ref>.supabase.co/auth/v1/callback`
2. **Supabase** → **Authentication → Providers → Discord** aktivieren und
   **Client ID** sowie **Client Secret** aus dem Discord-Portal eintragen.
3. **Supabase** → **Authentication → URL Configuration**:
   - **Site URL:** `https://freistaat-dashboard.vercel.app`
   - **Redirect URLs:**
     - `https://freistaat-dashboard.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
4. Scope `identify` genügt. Die App startet den Flow über
   `signInWithDiscord` mit `redirectTo=<origin>/auth/callback?next=/profil`.

Nach dem Setzen der Environment-Variablen in Vercel neu deployen.

## 4. Datenmodell

| Tabelle | Zweck |
| --- | --- |
| `parties` | Parteien und Programme |
| `people` | Personen (Kandidaten und Referendums-Optionen) |
| `elections` | Wahlen mit Fristen, Typ und `results_public` |
| `candidacies` | Person × Wahl, inkl. Listenplatz |
| `initiatives` | Bürgerbegehren mit Schwelle und Basis-Unterschriften |
| `votes` | Eine Stimme pro `(election_id, user_id)` |
| `initiative_signatures` | Eine Unterschrift pro `(initiative_id, user_id)` |
| `profiles` | Discord-ID, Anzeigename, Avatar, Rolle |
| `published_results` | Veröffentlichte Wahlergebnisse |
| `site_settings` | Basis-Bürgerzahl |

Die Status (`candidacy`, `open`, `closed`, `published`) werden **nicht**
gespeichert, sondern aus den Fristen und `results_public` abgeleitet
(`lib/status.ts`).

## 5. RLS und Rechte

- Öffentlich lesbar: Parteien, Personen, Wahlen, Kandidaturen, Initiativen,
  veröffentlichte Ergebnisse.
- Profile: nur das eigene Profil.
- Stimmen und Unterschriften: nur eigene lesen, eigene einfügen.
- `can_vote()` verlangt ein Profil mit Rolle `citizen` oder `admin`.
- Trigger prüfen Fristen, gültige Optionen, eine Stimme pro Wahl und die
  Unterschriftenschwelle.
- `initiative_overview` und `citizen_count` laufen mit Owner-Rechten, geben
  aber nur Aggregate preis – keine User-IDs.

Neue Konten werden per Trigger aus den Discord-Metadaten angelegt und sind
standardmäßig `citizen`. Alle angemeldeten Konten dürfen damit wählen; eine
Prüfung der Discord-Rolle „Bürger“ ist noch nicht eingebaut.

### Wahlleitung ernennen

```sql
update public.profiles
set role = 'admin'
where discord_id = 'DEINE_DISCORD_ID';
```

### Ergebnis veröffentlichen

Erst nach Ende der Abstimmung:

```sql
select public.publish_election('wahl-rat-2026');
```

Die Funktion ist nur für `admin` erlaubt, kopiert die Stimmen nach
`published_results` und setzt `results_public = true`. Die Website zeigt das
Ergebnis danach im Wahl-Archiv.

## 6. Testen

1. `npm run dev`, `/profil` öffnen und mit Discord anmelden.
2. Bei einer offenen Wahl abstimmen; nach dem Reload erscheint die Stimme im
   Profil. Eine zweite Stimme wird von Datenbank und UI abgelehnt.
3. Ein Bürgerbegehren unterschreiben; die Zahl erhöht sich und die Unterschrift
   steht im Profil.
4. In Supabase prüfen:

```sql
select * from public.initiative_overview;
select * from public.citizen_count;
select * from public.published_results;
```

Bei `?error=auth` stimmen die Redirect-URLs nicht. Bei `?error=discord` fehlen
Client-ID/Secret oder der Provider ist deaktiviert.

## 7. Ohne Supabase

Fehlen die Variablen, bleibt die Website vollständig nutzbar:

- Inhalte kommen aus `lib/mock-data.ts`.
- Stimmen und Unterschriften bleiben im `localStorage`.
- Die Profilseite zeigt einen Hinweis statt des Login-Buttons.

## 8. Änderungen an den Daten

Nach dem Livegang Inhalte über den **Table Editor** oder SQL pflegen, nicht
über die Seed-Abschnitte der Migration. Die Migration ist für die erstmalige
Einrichtung gedacht.
