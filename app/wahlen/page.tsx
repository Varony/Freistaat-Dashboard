import type { Metadata } from "next";
import { ElectionCard } from "@/components/election-card";
import { Badge, Card, Container, SectionHeading } from "@/components/ui";
import { elections } from "@/lib/mock-data";
import type { Election, ElectionStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Wahlen",
  description: "Laufende Wahlen, Bewerbungsphasen und Ergebnisse im Freistaat.",
};

const groups: Array<{
  statuses: ElectionStatus[];
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    statuses: ["open"],
    eyebrow: "Jetzt abstimmen",
    title: "Laufende Wahlen",
    description: "Diese Wahlen sind geöffnet. Jede Stimme zählt bis zum Ende der Frist.",
  },
  {
    statuses: ["candidacy"],
    eyebrow: "Bewerbung",
    title: "Kandidaturen gesucht",
    description: "Hier läuft die Bewerbungsphase. Die Abstimmung startet anschließend.",
  },
  {
    statuses: ["closed", "published"],
    eyebrow: "Archiv",
    title: "Abgeschlossene Wahlen",
    description: "Ausgezählte und veröffentlichte Ergebnisse zum Nachlesen.",
  },
];

export default function ElectionsPage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Demokratie</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Wahlen
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Ämter und Rat werden von den Bürgern gewählt. Bewerbungsphasen,
            Stimmabgabe und Ergebnisse laufen an einem Ort zusammen.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="space-y-14">
          {groups.map((group) => {
            const items: Election[] = elections.filter((election) =>
              group.statuses.includes(election.status),
            );

            if (items.length === 0) return null;

            return (
              <section key={group.title}>
                <SectionHeading
                  eyebrow={group.eyebrow}
                  title={group.title}
                  description={group.description}
                />
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {items.map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <Card className="mt-16 p-6 sm:p-8">
          <SectionHeading
            eyebrow="Ablauf"
            title="So läuft eine Wahl"
            description="Jede Wahl hat drei Phasen. Der Stimmzettel wird beim Öffnen eingefroren."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "1. Bewerbung",
                text: "Kandidaturen und Listen werden eingereicht und von der Wahlleitung freigegeben.",
              },
              {
                title: "2. Abstimmung",
                text: "Bürger stimmen auf der Website ab. Eine Stimme pro Person und Wahl.",
              },
              {
                title: "3. Ergebnis",
                text: "Die Auszählung wird veröffentlicht. Bei Ratswahlen nach Sainte-Laguë.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-surface-2/40 p-5"
              >
                <p className="text-sm font-medium text-text">{step.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </>
  );
}
