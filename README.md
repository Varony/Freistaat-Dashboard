# Freistaat

Website für eine Demokratie-Simulation im Discord: Wahlen, Bürgerbegehren,
Gesetze und Parteien an einem Ort.

Aktueller Stand: **klickbarer Prototyp mit Beispieldaten**. Es gibt noch keine
Anmeldung und keine echte Stimmabgabe. Die Daten liegen in `lib/mock-data.ts`.

## Entwicklung

```bash
npm install
npm run dev
```

Öffne http://localhost:3000.

```bash
npm run build   # Produktionsbuild
npm run lint    # ESLint
```

## Struktur

```
app/                 Seiten (Next.js App Router)
components/          Layout- und UI-Komponenten
  ui.tsx             Card, Badge, Button, Progress, Avatar, Stat …
  vote-form.tsx      Stimmabgabe (Demo, localStorage)
  initiative-sign.tsx Unterschrift (Demo, localStorage)
lib/
  site-config.ts     Name, Navigation, Discord-Link
  mock-data.ts       Beispieldaten: Wahlen, Begehren, Parteien, Gesetze
  laws.ts            liest content/Gesetze.md, Fallback auf Beispieldaten
  types.ts           Datentypen
content/Gesetze.md   Gesetzblatt (aktuell leer, später aus Discord befüllt)
```

## Design anpassen

Alle Gestaltungs-Tokens stehen oben in `app/globals.css`:

- `--app-bg`, `--app-surface`, `--app-border`, `--app-text`, `--app-muted`
- `--app-accent` (aktuell neutral, später Gold/Blau/Rot)
- `--app-font-sans` (aktuell Systemschrift)
- `--app-radius`

Die Tailwind-Klassen (`bg-bg`, `text-muted`, `border-border`, `rounded-card`)
hängen daran. Für einen Wechsel des Grundstils reicht es, diese Variablen zu
ändern. Ein helles Theme kann später über einen zweiten Tokensatz ergänzt
werden.

## Nächste Schritte

- Discord-Login und echte Stimmabgabe (Supabase)
- Bot-Sync für das Gesetzblatt (siehe `TODO.md`)
- Feinschliff von Farben, Schrift und Layout
