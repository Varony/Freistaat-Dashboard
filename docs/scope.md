# Scope: Freistaat – Demokratie-Simulation für Discord

Stand: 2026-10-19 (Version 2, nach Vergleich mit bestehenden Open-Source-Projekten)

## 1. Ziel

Eine Website für einen Mock-Politik-Discord-Server, auf der verifizierte Mitglieder:

- sich mit einem Programm zur Wahl aufstellen lassen,
- in Parteien organisieren,
- an Wahlen zum Rat und zu Einzelämtern teilnehmen,
- Bürgerbegehren starten und unterschreiben,
- über Bürgerbegehren und Wahlen abstimmen.

Discord liefert Identität und Kommunikation, die Website die eigentliche Wahlhandlung.
Die Verwaltung (Wahlen anlegen, beenden, Kandidaturen freigeben) läuft über
Slash-Commands eines Discord-Bots.

## 2. Nicht-Ziele (bewusst außen vor)

- Keine echte Rechtsgültigkeit, keine Wählerverzeichnis-Anbindung an Behörden.
- Kein Mehrserver-Betrieb: eine Instanz = ein Discord-Server.
- Keine Chat-/Forum-Funktion – Diskussion bleibt in Discord.
- Kein Mobile-App-Store-Client (responsive Web reicht).
- Kein Bezahlmodell, keine Werbung.
- **Kein Regierungs-Simulator im ersten Ausbau:** Gesetze, Anträge, Ausschüsse,
  Ministerien und Budgets sind ein eigenes Produkt (siehe Referenzprojekte
  `Capitol` und `botcracy`). Der Scope endet zunächst bei Wahl und Volksabstimmung.

## 3. Referenzprojekte und was wir daraus übernehmen

Die Recherche zeigt: Es gibt Abstimmungs-Bots, E-Participation-Plattformen und
Mock-Government-Bots – aber keine Kombination aus allem. Wir bauen daher keinen
Fork, sondern übernehmen bewährte Muster.

### 3.1 E-Participation-Plattformen (Vorbild für Phasen und Verfahren)

| Projekt | Was es macht | Was wir übernehmen |
|---|---|---|
| [Decidim](https://github.com/decidim/decidim) | Bürgerbeteiligung: Vorschläge, Unterstützungen, Phasen, Wahlen mit Wählerverzeichnis oder Token, Ergebnisse erst nach Schließung | **Phasenmodell**, **Wählerverzeichnis (Census)** als eigenes Konzept, Schwellen für Vorschläge, Ergebnis-Veröffentlichung erst nach Ende |
| [CONSUL DEMOCRACY](https://github.com/consuldemocracy/consuldemocracy) | Vorschläge mit Unterschriften, Bürgerhaushalt, Gesetzgebungsverfahren | Das Muster **Vorschlag → Unterstützungen → Schwelle → Abstimmung** ist genau unser Bürgerbegehren und wird als Standard übernommen |

### 3.2 Discord-Wahl- und Abstimmungsbots

| Projekt | Was es macht | Was wir übernehmen |
|---|---|---|
| [Electable / cdsmith/votebot](https://github.com/cdsmith/votebot) | Wahlbot mit vielen Methoden (Plurality, IRV/STV, Approval, Score …), geheime Ballots, geplante Enden, Ergebnisdetails | Bot-UX, **geheime Stimmabgabe**, automatische Endzeit, ausführlicher Ergebnisbericht. Wichtig: **offene Parteilisten sind dort ausdrücklich nicht implementiert** – ein Warnsignal für unseren Aufwand |
| [Votum](https://github.com/evaera/Votum) | Rats-/Gremienabstimmungen mit Quorum, Fristen, Gewichtung, Rollen-Gate, Deliberations-Channels | **Konfiguration pro Gremium/Wahl** statt globaler Einstellungen; optionale Stimmgewichtung; Fristen und Quorum |
| [Pollmaster](https://github.com/matnad/pollmaster) | Polls mit Rollenfilter, Gewichtung, versteckten Zwischenständen, Scheduling | **Rollen-Gate** und **versteckte Zwischenstände** („anti-sheeping") als Pflicht-Toggles |
| [Equal-Vote/discord-bot](https://github.com/Equal-Vote/discord-bot) | Discord-Bot verlinkt auf eine externe Star-Voting-Website | Bestätigt unsere Architektur **Bot steuert, Website wählt** |
| [Capitol / discord_gov_bot](https://github.com/botahamec/discord_gov_bot) | Kongress-Simulation: yea/nay/abstain, Speaker-Rolle, Ergebnis-Channel, wer noch nicht gewählt hat | Getrennte **Wählerrolle**, Turnus-Tracking. Zeigt gleichzeitig: „Regieren" ist ein separates Produkt |
| [Botcracy](https://github.com/rjthacker/botcracy) | Mock-Government-Bot: Gesetze, Executive Orders, Voter-Rolle | **Explizite Registrierung als Wähler** statt „jeder Server-Member darf wählen" |

### 3.3 Technik- und Integritätsreferenzen

| Projekt | Was es macht | Was wir übernehmen |
|---|---|---|
| [GWA Votes](https://github.com/sampoder/gwa-votes) | Schülerratswahl mit **Next.js + Supabase** | Bestätigt unseren Stack. Gleichzeitig **Anti-Pattern**: Stimmenzähler werden in Nutzerzeilen hochgezählt, Ergebnisse hinter einem geteilten Passwort. Bei uns: unveränderliche Stimmen, Zählung per Query, echte Rollen |
| [Helios](https://github.com/benadida/helios-server) | Ende-zu-Ende-verifizierbares Online-Wählen | **Beleg/Receipt** für die eigene Stimme und veröffentlichter Ergebnis-Hash – als Konzept, nicht als Kryptografie-Ausbau |
| [RCTab / BrightSpots/rcv](https://github.com/BrightSpots/rcv) | Professioneller Ranked-Choice-Tabulator mit Audit-Reports | **Auszählung als isoliertes, getestetes Modul** mit nachvollziehbarem Ergebnisbericht |
| [SimpleVote](https://github.com/dessalines/simple-vote) | Live-Voting mit optionaler Anonymität und Schwellen | Live-Ergebnisse und Anonymitäts-Toggle als etablierte Funktionen |

### 3.4 Erkenntnisse daraus

1. **Phasen sind Pflicht.** Kein ernsthaftes System kennt nur „offen/zu". Decidim und
   Consul trennen Einreichung, Unterstützung, Prüfung und Abstimmung. Unser
   bisheriges Modell ohne Bewerbungsphase war der größte Fehler.
2. **Das Wählerverzeichnis ist ein eigenes Objekt.** Decidim nennt es Census. Es
   reicht nicht, „Mitglied der Guild" zu prüfen – die Menge der Wahlberechtigten
   muss zum Wahlbeginn eingefroren werden.
3. **Stimmen nie als Zähler speichern.** Alle ernsthaften Systeme speichern
   unveränderliche Einzelstimmen und leiten Summen ab. Das macht Nachzählungen und
   Audits möglich.
4. **Geschlossene Listen zuerst.** Offene Listen, Panaschieren und Vorzugsstimmen
   sind der Komplexitätstreiber. Electable lässt sie bewusst weg. MVP: geschlossene
   Parteilisten.
5. **Konfiguration gehört an die Wahl, nicht in die App.** Votum und Pollmaster
   zeigen: Fristen, Quorum, Gewichtung und Sichtbarkeit sind Pro-Wahl-Einstellungen.
6. **Bot und Fachlogik trennen.** Equal-Vote und Electable machen den Bot zur
   Steuerungsschicht. Berechtigungen und Auszählung dürfen nicht im Bot leben.

## 4. Rollen und Rechte

| Rolle | Rechte |
|---|---|
| Besucher | Login-Seite, öffentliche Ergebnisse einsehen (falls freigegeben) |
| Bürger | abstimmen, unterschreiben, Bürgerbegehren starten, Partei beitreten, kandidieren |
| Parteivorsitz | Parteiprofil pflegen, Mitglieder verwalten, Kandidatenliste aufstellen |
| Kandidat | Bürger + freigegebene Kandidatur mit Programm |
| Amtsinhaber | Gewählte Person, erhält automatisch eine Discord-Rolle |
| Wahlleitung | Wahlen/Begehren anlegen und beenden, Kandidaturen und Parteien freigeben, Ergebnisse prüfen |

**Quelle der Wahrheit ist Discord:** „Bürger" und „Wahlleitung" sind Discord-Rollen
(IDs in der Konfiguration). Die App cached sie beim Login in der Datenbank, prüft
bei heiklen Aktionen aber immer die Rolle aus dem Discord-Token bzw. über den Bot.
Kein Env-Var-Admin-Login, kein separates Passwort.

## 5. Kernabläufe

### 5.1 Beitritt und Verifizierung

1. Bürger öffnet die Website und klickt „Mit Discord anmelden".
2. OAuth2 mit den Scopes `identify`, `guilds`, `guilds.members.read`.
3. Die App liest die Guild-Mitgliedschaft und die Rollen der Person direkt über
   `GET /users/@me/guilds/{guild.id}/member` – dafür ist kein privilegierter
   Bot-Intent nötig.
4. Prüfungen: Mitglied der konfigurierten Guild, Rolle „Bürger", optional
   Mindestalter des Accounts und Mindestdauer der Mitgliedschaft.
5. Profil wird angelegt/aktualisiert; `roles_verified_at` wird gespeichert.
6. Vor dem Öffnen einer Wahl wird die aktuelle Rolle erneut geprüft.

### 5.2 Partei gründen und beitreten

1. `/partei gruenden name:<Name> kuerzel:<Kürzel>` im Discord.
2. Partei entsteht im Status „in Prüfung"; die Wahlleitung gibt sie frei.
3. Gründung braucht mindestens 3 bestätigte Mitglieder (konfigurierbar), damit
   keine Ein-Personen-Parteien den Stimmzettel fluten.
4. Beitritt über die Website oder `/partei beitreten`.
5. Mitgliedschaft ist exklusiv: eine Person gehört höchstens einer Partei an.
   Wechsel ist möglich, aber während einer offenen Wahl eingefroren.
6. Der Vorsitz pflegt Name, Kürzel, Farbe und Kurzprogramm.

### 5.3 Kandidatur (mit Bewerbungsphase)

Jede Wahl hat drei Zeitfenster:

1. **Bewerbungsphase** (`candidacy_starts_at` … `candidacy_ends_at`)
   - Personenwahl: `/kandidieren wahl:<ID>` → Programm → Freigabe.
   - Ratswahl: Der Parteivorsitz stellt die geschlossene Liste auf
     (`/partei liste`), die Wahlleitung gibt die Liste frei.
   - Unabhängige: nur bei Personenwahlen. Bei Ratswahlen bilden sie keine Liste
     und treten nicht an (bewusste Vereinfachung).
2. **Wahlphase** (`voting_starts_at` … `voting_ends_at`)
   - Der Stimmzettel wird beim Öffnen **eingefroren** (Kandidaten, Reihenfolge,
     Parteinamen). Änderungen sind danach ausgeschlossen.
   - Das Wählerverzeichnis wird beim Öffnen als Snapshot erzeugt.
3. **Ergebnisphase** (`closed` → `published`)
   - Auszählung, Prüfung, Veröffentlichung gemäß Sichtbarkeits-Toggle.

### 5.4 Wahl durchführen

1. `/wahl erstellen titel:<...> typ:<person|rat> bewerbung_bis:<...> wahl_bis:<...> sitze:<n>`
2. Bot postet Ankündigung mit Link in einen konfigurierten Channel.
3. Bürger stimmt auf der Website ab. Eine Stimme pro Wahl und Person.
4. Personenwahl: einfache Mehrheit. Ratswahl: geschlossene Listen, Sitzverteilung
   nach Sainte-Laguë.
5. `/wahl beenden` schließt die Wahl sofort; sonst automatisch zum Endzeitpunkt.
6. Ergebnis wird gemäß Einstellung angezeigt; ein Ergebnisbericht wird gespeichert.

### 5.5 Bürgerbegehren (Muster von Consul/Decidim)

1. Bürger reicht auf der Website Titel, Text und Frist ein.
2. Freigabe durch die Wahlleitung (Schutz vor Spam).
3. Status `collecting`: Bürger unterschreiben; jede Person einmal pro Begehren.
4. Bei erreichter Schwelle → Status `qualified`: automatisch wird eine
   Volksabstimmung (Ja/Nein) angelegt und im Discord angekündigt.
5. Wird die Schwelle bis zur Frist nicht erreicht → `expired`.
6. Die Schwelle wird beim Anlegen als absolute Zahl eingefroren
   (Prozentwert × damalige Bürgerzahl), damit sie sich nicht nachträglich ändert.

## 6. Einstellungen pro Wahl

| Einstellung | Werte | Default |
|---|---|---|
| Ergebnissichtbarkeit | live / nach Ende | nach Ende |
| Stimmensichtbarkeit | anonym / öffentlich | anonym |
| Stimmabgabe änderbar | ja / nein | nein |
| Sitzzahl | 1–20 | 5 |
| Sperrklausel | 0–10 % | 5 % |
| Quorum (Mindestbeteiligung) | Zahl oder aus | aus |
| Mehrheitsregel (Personenwahl) | einfache Mehrheit / Stichwahl | einfache Mehrheit |
| Unabhängige Kandidaten | ja / nein | ja |
| Stimmgewicht | 1 pro Person (Gewichtung nur für Gremien, nicht für Bürgerwahlen) | 1 |

**Anonymität und Änderbarkeit:** Bei anonymen Wahlen speichert der Server keinen
Zusammenhang zwischen Person und Stimme. Eine Änderung ist dann nur über einen
**Beleg (Receipt)** möglich, den der Browser erhält: Der Server ersetzt die Stimme
mit demselben Beleg, ohne zu wissen, wem sie gehört. Für den MVP gilt:
**anonym = fest**. Der Receipt-Mechanismus ist als spätere Option vorgesehen und
wird nicht als unmöglich dargestellt.

## 7. Datenmodell (Skizze)

```
users                id, discord_id, username, avatar_url,
                     is_buerger, is_wahlleitung,          -- Cache der Discord-Rollen
                     roles_verified_at, created_at,
                     discord_created_at, guild_joined_at

parties              id, name, short_name, color, program, leader_id,
                     status (pending|approved|rejected), created_at

party_members        party_id, user_id, role (leader|member), joined_at
                     unique(user_id)                      -- exklusive Mitgliedschaft

elections            id, title, description, type (person|rat|referendum),
                     seats, status
                       (draft|candidacy|open|closed|published|archived),
                     candidacy_starts_at, candidacy_ends_at,
                     voting_starts_at, voting_ends_at, published_at,
                     result_visibility, ballot_visibility, changeable,
                     threshold_percent, quorum, allow_independents,
                     source_initiative_id, created_by, created_at

election_eligibility election_id, user_id, snapshot_at
                     unique(election_id, user_id)          -- eingefrorenes Wählerverzeichnis

election_parties     election_id, party_id, list_status
                       (pending|approved|rejected), approved_at
                     unique(election_id, party_id)

candidacies          id, election_id, user_id, party_id (nullable),
                     list_position, statement,
                     status (pending|approved|rejected|withdrawn)
                     unique(election_id, user_id)          -- niemand steht doppelt auf dem Zettel

ballots              id, election_id, voter_id, cast_at
                     unique(election_id, voter_id)         -- Teilnahme-Nachweis

votes                id, election_id, choice_type (candidacy|party|yes|no),
                     choice_id, cast_at, receipt (nullable)
                     -- append-only; keine Zähler in anderen Tabellen

initiatives          id, author_id, title, text,
                     threshold_absolute, threshold_percent,
                     starts_at, ends_at,
                     status (pending|collecting|qualified|expired|rejected),
                     referendum_election_id (nullable)

signatures           initiative_id, user_id, created_at
                     unique(initiative_id, user_id)

audit_log            id, actor_id, action, target_type, target_id, payload, created_at
                     -- append-only

discord_outbox       id, type (role_add|role_remove|announce), payload,
                     status (pending|sent|failed), attempts, last_error
```

Wichtige Regeln:

- **Keine Stimmenzähler** in `candidacies` oder `parties`. Summen werden aus
  `votes` berechnet (SQL-View/Materialized View), damit Nachzählungen möglich sind.
- `votes` ist append-only. Korrekturen nur durch neue Stimme + Supersede-Eintrag.
- `ballots` und `votes` werden in einer Transaktion geschrieben. Bei anonymen
  Wahlen bleibt `votes.receipt` der einzige Bezug – ohne `voter_id`.
- Beim Öffnen einer Wahl werden `election_eligibility` und der Stimmzettel
  eingefroren; spätere Rollen- oder Parteimitgliedschaftsänderungen wirken nicht
  mehr auf diese Wahl.
- Alle Zeitstempel in UTC, Anzeige in `Europe/Berlin`.

## 8. Auszählung

**Personenwahl:** höchste Stimmenzahl gewinnt. Gleichstand → Stichwahl, falls
aktiviert, sonst Losentscheid durch die Wahlleitung (im Audit-Log dokumentiert).

**Ratswahl (Sainte-Laguë, geschlossene Listen):**
1. Gültige Listenstimmen je Partei summieren.
2. Parteien unter der Sperrklausel ausschließen.
3. Sitze iterativ nach `Stimmen / (2s + 1)` vergeben (s = bisherige Sitze).
4. Gleichstand beim Divisor: Losentscheid, mit festem Seed im Ergebnisbericht.
5. Sitze werden in Listenreihenfolge besetzt.
6. Hat eine Partei mehr Sitze als Kandidaten, verfallen die Reste und gehen an die
   nächste Partei in der Divisor-Reihenfolge.
7. Nachrücken bei Ausscheiden: nächster nicht gewählter Kandidat der Liste.
8. Ergebnisbericht mit Divisoren, Zuteilungsschritten und Stimmenzahlen speichern.

**Volksabstimmung:** Ja/Nein, einfache Mehrheit; optional Quorum.

Die Auszählung ist ein **isoliertes Modul** (reine Funktionen, keine DB-Zugriffe)
mit Unit-Tests und festen Testvektoren. Sie läuft nicht im Bot.

## 9. Discord-Bot (Slash-Commands)

| Command | Berechtigung | Zweck |
|---|---|---|
| `/wahl erstellen` | Wahlleitung | Wahl anlegen und ankündigen |
| `/wahl beenden` | Wahlleitung | Wahl vorzeitig schließen |
| `/wahl status` | alle | Laufende Wahlen, Phasen und Links |
| `/partei gruenden` | Bürger | Partei gründen |
| `/partei beitreten` | Bürger | Partei beitreten |
| `/partei liste` | Parteivorsitz | Geschlossene Liste für Ratswahl aufstellen |
| `/kandidieren` | Bürger | Kandidatur für Personenwahl einreichen |
| `/begehren` | Bürger | Link zum Einreichen posten |
| `/profil` | Bürger | Profil, Partei, Stimmbelege |
| `/wahlleitung` | Wahlleitung | Offene Freigaben anzeigen |

Der Bot ist reine Steuerungs- und Benachrichtigungsschicht. Alle fachlichen
Entscheidungen (Berechtigung, Fristen, Auszählung) liegen in der Web-App/DB.
Rollenvergabe an Gewählte läuft über die Outbox mit Retry.

## 10. Betrugsschutz und Integrität

Discord-Accounts sind kostenlos, daher sind harte Garantien unmöglich.
Maßnahmen:

- Pflicht: Mitglied der konfigurierten Guild **und** Rolle „Bürger".
- Optional: Mindestalter des Accounts (Default 30 Tage).
- Optional: Mindestdauer der Server-Mitgliedschaft (Default 7 Tage).
- Wählerverzeichnis-Snapshot beim Öffnen der Wahl; keine Teilnahme von Personen,
  die erst danach beitreten.
- Eine Stimme pro Wahl über `unique(election_id, voter_id)`.
- Unterschriften ebenfalls eindeutig pro Person.
- Kein Login ohne Discord – keine E-Mail-/Passwort-Accounts.
- Kein geteiltes Admin-Passwort für Ergebnisse (Anti-Pattern aus GWA Votes).
- Audit-Log für alle Verwaltungsaktionen, append-only.
- Nach Schließung: Hash über alle Stimmen bilden und im Ergebnisbericht
  veröffentlichen. Damit ist nachträgliche Manipulation erkennbar.
- Backups/Export nach jeder Wahl (CSV + JSON).

## 11. Rechtliches und Datenschutz

Auch ein Hobby-Server verarbeitet personenbezogene Daten (Discord-ID, Rollen,
Stimmverhalten). Minimalumfang:

- Datenschutzerklärung und Impressum auf der Website.
- Zweckbindung: Daten nur für Wahlen, Begehren und Rollenvergabe.
- Löschung auf Anfrage (Profil und personenbezogene Verknüpfungen; anonyme
  Stimmen bleiben als Aggregat erhalten).
- Aufbewahrungsfrist für personenbezogene Daten festlegen (Vorschlag: bis 30 Tage
  nach Ende der Wahl, danach Anonymisierung der Verknüpfung).
- Supabase-Region EU wählen; AVV mit Vercel und Supabase abschließen.
- Keine Tracking-Cookies, keine Analytics im MVP.

## 12. Technik und Hosting

- **Frontend + Backend:** Next.js (App Router), TypeScript, Tailwind
- **Auth:** **Supabase Auth mit Discord-Provider** (nicht Auth.js – Supabase
  bringt OAuth, Session und DB-User in einem)
- **Datenbank:** Supabase Postgres; Schreibzugriffe über Server Actions/Route
  Handler, RLS für Lesezugriffe
- **Bot:** Bevorzugt **HTTP-Interactions-Endpoint** in Next.js
  (`/api/discord/interactions`, Ed25519-Signaturprüfung). Damit entfällt ein
  separater Dauerprozess. Alternative: discord.js-Gateway auf Railway (~5 $/Monat)
- **Hosting:** Code auf GitHub, App auf Vercel, DB auf Supabase
- **Wichtig:** Supabase pausiert Free-Projekte nach ca. 7 Tagen Inaktivität →
  Cron-Ping einrichten oder kostenpflichtigen Tarif einplanen
- **Umgebungsvariablen:** Discord Client-ID/Secret, Public Key, Bot-Token,
  Guild-ID, Bürger-Rollen-ID, Wahlleitungs-Rollen-ID, Supabase-URL/Keys

GitHub Pages scheidet aus, weil Login, Datenbank und Secrets einen Server
benötigen. GitHub bleibt die Quelle für Code und CI.

## 13. Umsetzungsphasen

### M0 – Setup
- Next.js-Projekt, Tailwind, Supabase-Schema und Migrationen
- Discord-Application, OAuth, Bot-Grundgerüst
- CI auf GitHub (Lint, Typecheck, Tests)

### M1 – Fundament
- Discord-Login + Rollen-/Guild-Prüfung
- Profilseite, Bürger- und Wahlleitungs-Erkennung
- Audit-Log, Discord-Outbox
- `/profil`, `/wahl status`

### M2 – Personenwahl (erste echte Wahl)
- Parteien zunächst als **Label** (Name, Kürzel, Farbe, Programm); Mitglieder-
  verwaltung erst in M3
- Kandidaturen mit Bewerbungsphase und Freigabe
- Personenwahl mit einfacher Mehrheit
- Stimmabgabe, Ergebnis-Toggles, Ergebnisbericht
- `/wahl erstellen`, `/wahl beenden`, `/kandidieren`

### M3 – Ratswahl und Parteien
- Parteigründung, Beitritt, Vorsitz, Freigabe
- Geschlossene Listen und Listenfreigabe
- Sainte-Laguë inkl. Sperrklausel, Gleichstand und Überhang
- Wählerverzeichnis-Snapshot
- `/partei gruenden`, `/partei beitreten`, `/partei liste`

### M4 – Bürgerbegehren und Ämter
- Begehren einreichen, freigeben, unterschreiben
- Automatische Umwandlung in Volksabstimmung bei Schwelle
- Discord-Rollenvergabe an Gewählte mit Retry
- Benachrichtigungen und Erinnerungen

### M5 – Komfort und Ausbau
- Live-Aktualisierung der Ergebnisse
- Stichwahlen
- Belege/Receipts und Verifikationsseite
- Export (CSV/PDF), Wahlarchiv
- Admin-Dashboard im Web
- Optional: Gremienabstimmungen (Anträge, Gesetze) als eigenes Modul

## 14. Erfolgskriterien und Tests

**Definition of Done für M2:**
Eine Personenwahl mit mindestens 20 Bürgern läuft ohne manuellen Eingriff durch:
Ankündigung, Bewerbungsphase, Stimmabgabe, automatische Schließung, Auszählung,
Ergebnisanzeige. Doppelte Stimmen sind ausgeschlossen, das Audit-Log ist
vollständig, und die Wahl ist im Archiv abrufbar.

**Definition of Done für M3:**
Eine Ratswahl mit 3 Parteien und 5 Sitzen liefert eine nachvollziehbare
Sitzverteilung inklusive Divisor-Tabelle und korrekter Listenbesetzung.

**Tests:**
- Unit-Tests für Sainte-Laguë mit festen Testvektoren (inkl. Gleichstand,
  Sperrklausel, Überhang).
- Integrationstests für doppelte Stimmen und Wählerverzeichnis.
- Playwright für Login → Kandidatur → Abstimmung → Ergebnis.
- Auszählung zusätzlich als CLI gegen exportierte Rohdaten lauffähig.

## 15. Offene Punkte mit Default-Vorschlag

| Punkt | Default, falls keine andere Entscheidung |
|---|---|
| Wahlperiode | 6 Wochen, danach automatische Neuwahl-Erinnerung |
| Ratssitze | 5 |
| Sperrklausel | 5 % |
| Parteigründung | 3 Mitglieder + Freigabe durch Wahlleitung |
| Parteimitgliedschaft | exklusiv; Wechsel während offener Wahl eingefroren |
| Amtsinhaber-Rolle | automatisch bei Wahl, Entzug bei Neuwahl |
| Bürgerbegehren-Schwelle | 20 % der verifizierten Bürger, als absolute Zahl eingefroren |
| Frist für Begehren | 14 Tage |
| Bewerbungsphase | 7 Tage vor Wahlbeginn |
| Stimmabgabe anonym | Standard, dann nicht änderbar |
| Unabhängige | nur bei Personenwahlen |
| Aufbewahrung | personenbezogene Verknüpfung 30 Tage nach Wahlende |

## 16. Nächste Schritte

1. Offene Punkte aus Abschnitt 15 bestätigen oder ändern.
2. Discord-Application anlegen (Client-ID/Secret, Public Key, Bot-Token, Guild-ID).
3. Rollen „Bürger" und „Wahlleitung" im Server anlegen.
4. Supabase-Projekt in der EU-Region anlegen.
5. M0 + M1 umsetzen und Login Ende-zu-Ende testen.
6. Danach M2 (Personenwahl) als erste echte Wahl im Server.
