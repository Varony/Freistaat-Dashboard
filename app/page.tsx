import Link from "next/link";
import { ElectionCard } from "@/components/election-card";
import { IconArrowRight, IconFile, IconUsers, IconVote } from "@/components/icons";
import { InitiativeCard } from "@/components/initiative-card";
import { PartyCard } from "@/components/party-card";
import {
  Badge,
  buttonClasses,
  Card,
  Container,
  SectionHeading,
  Stat,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getLaws } from "@/lib/laws";
import { elections, initiatives, parties, statistics } from "@/lib/mock-data";

export default async function HomePage() {
  const laws = await getLaws();

  const runningElections = elections.filter(
    (election) => election.status === "open" || election.status === "candidacy",
  );
  const activeInitiatives = initiatives.filter(
    (initiative) =>
      initiative.status === "collecting" || initiative.status === "qualified",
  );
  const latestLaws = laws.slice(0, 3);

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <Badge tone="accent">Legislatur 2026</Badge>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-text sm:text-6xl">
              Der Freistaat, auf einen Blick.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Wahlen, Bürgerbegehren und Gesetze an einem Ort. Verfolge laufende
              Verfahren, lies Beschlüsse nach und bring eigene Anträge ein.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/wahlen" className={buttonClasses("primary", "lg")}>
                Wahlen ansehen
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/gesetze" className={buttonClasses("secondary", "lg")}>
                Gesetze lesen
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-faint">
              <span className="inline-flex items-center gap-2">
                <IconUsers className="h-3.5 w-3.5" />
                {statistics.citizens} Bürger
              </span>
              <span className="inline-flex items-center gap-2">
                <IconVote className="h-3.5 w-3.5" />
                {runningElections.length} laufende Verfahren
              </span>
              <span className="inline-flex items-center gap-2">
                <IconFile className="h-3.5 w-3.5" />
                {laws.length} Gesetze
              </span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value={statistics.citizens} label="Bürger" hint="verifizierte Mitglieder" />
          <Stat
            value={runningElections.length}
            label="Laufende Verfahren"
            hint="Wahlen und Bewerbungen"
          />
          <Stat
            value={activeInitiatives.length}
            label="Aktive Bürgerbegehren"
            hint="sammeln oder qualifiziert"
          />
          <Stat value={laws.length} label="Gesetze" hint="im Gesetzblatt" />
        </div>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Demokratie"
            title="Laufende Wahlen"
            description="Stimme ab oder verfolge die Bewerbungsphase."
            action={
              <Link
                href="/wahlen"
                className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
              >
                Alle Wahlen
                <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {runningElections.slice(0, 4).map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Beteiligung"
            title="Bürgerbegehren"
            description="Unterschriften sammeln, Schwelle erreichen, Volksabstimmung auslösen."
            action={
              <Link
                href="/buergerbegehren"
                className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
              >
                Alle Begehren
                <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {activeInitiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <SectionHeading
              eyebrow="Gesetzblatt"
              title="Zuletzt beschlossen"
              action={
                <Link
                  href="/gesetze"
                  className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
                >
                  Alle Gesetze
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <Card className="mt-6 divide-y divide-border">
              {latestLaws.map((law) => (
                <Link
                  key={law.id}
                  href={`/gesetze#${law.id}`}
                  className="group flex items-center gap-4 p-5 transition-colors hover:bg-surface-2/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-faint">
                    <IconFile className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {law.title}
                    </span>
                    <span className="mt-0.5 block line-clamp-1 text-xs text-muted">
                      {law.body.replace(/[*#>`]/g, "").slice(0, 120)}
                    </span>
                  </span>
                  <IconArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </Card>
          </div>

          <Card className="h-fit p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              So funktioniert es
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-text">
              Drei Wege, mitzubestimmen
            </h3>
            <ol className="mt-5 space-y-4">
              {[
                {
                  title: "Wählen",
                  text: "Bei Wahlen entscheidest du über Ämter und den Rat.",
                },
                {
                  title: "Unterschreiben",
                  text: "Bürgerbegehren brauchen genug Stimmen, um abgestimmt zu werden.",
                },
                {
                  title: "Kandidieren",
                  text: "Stell dich zur Wahl und lege dein Programm offen.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-[11px] text-muted">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-text">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {step.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <Link
              href="/profil"
              className={buttonClasses("secondary", "sm", "mt-6 w-full")}
            >
              Mit Discord anmelden
            </Link>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Parteien"
            title="Parteien im Freistaat"
            description="Programme, Vorsitz und Mitgliederzahlen."
            action={
              <Link
                href="/parteien"
                className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
              >
                Alle Parteien
                <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xs text-faint">
          Prototyp mit Beispieldaten · Stand {formatDate(new Date().toISOString())}
        </p>
      </Container>
    </>
  );
}
