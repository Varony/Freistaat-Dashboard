import type { Metadata } from "next";
import { InitiativeCard } from "@/components/initiative-card";
import { DemoNotice } from "@/components/demo-notice";
import { DiscordLink } from "@/components/discord-link";
import {
  Badge,
  buttonClasses,
  Card,
  Container,
  SectionHeading,
} from "@/components/ui";
import { getInitiatives } from "@/lib/mock-data";
import type { Initiative, InitiativeStatus } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bürgerbegehren",
  description:
    "Bürgerbegehren im Freistaat: unterschreiben, Schwelle erreichen, Volksabstimmung auslösen.",
};

const groups: Array<{
  statuses: InitiativeStatus[];
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    statuses: ["collecting"],
    eyebrow: "Läuft",
    title: "Unterschriften sammeln",
    description:
      "Diese Begehren brauchen noch Stimmen. Jede Person kann einmal unterschreiben.",
  },
  {
    statuses: ["qualified"],
    eyebrow: "Qualifiziert",
    title: "Bereit für die Volksabstimmung",
    description:
      "Die Schwelle wurde erreicht. Diese Begehren werden zur Abstimmung gestellt.",
  },
  {
    statuses: ["rejected", "expired"],
    eyebrow: "Archiv",
    title: "Abgeschlossene Begehren",
    description:
      "Frist abgelaufen oder abgelehnt – hier bleiben die Vorgänge nachlesbar.",
  },
];

export default function InitiativesPage() {
  const initiativeList = getInitiatives();

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Beteiligung</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Bürgerbegehren
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Reiche ein Anliegen ein, sammle Unterschriften und bring es zur
            Volksabstimmung. Die Schwelle wird beim Anlegen festgehalten.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <Card className="p-6 sm:p-8">
          <SectionHeading
            eyebrow="Ablauf"
            title="Vom Anliegen zur Volksabstimmung"
            description="Drei Schritte, dieselben Regeln für alle."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "1. Einreichen",
                text: "Titel, Text und Frist festlegen. Die Wahlleitung prüft das Begehren.",
              },
              {
                title: "2. Unterschreiben",
                text: "Bürger unterschreiben einmal pro Begehren. Der Fortschritt ist öffentlich.",
              },
              {
                title: "3. Abstimmen",
                text: "Ist die Schwelle erreicht, wird automatisch eine Volksabstimmung angesetzt.",
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

        <div className="mt-14 space-y-14">
          {groups.map((group) => {
            const items: Initiative[] = initiativeList.filter((initiative) =>
              group.statuses.includes(initiative.status),
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
                  {items.map((initiative) => (
                    <InitiativeCard key={initiative.id} initiative={initiative} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <DemoNotice
          className="mt-16"
          title="Eigenes Bürgerbegehren starten?"
          action={
            <DiscordLink
              label="Im Discord einreichen"
              className={buttonClasses("secondary", "sm")}
            />
          }
        >
          Im nächsten Ausbau kann jedes Mitglied ein Begehren direkt einreichen.
          Bis dahin läuft die Einreichung über den Discord-Server.
        </DemoNotice>
      </Container>
    </>
  );
}
