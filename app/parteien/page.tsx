import type { Metadata } from "next";
import { PartyCard } from "@/components/party-card";
import { Badge, Card, Container } from "@/components/ui";
import { parties } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Parteien",
  description: "Parteien, Programme und Vorsitz im Freistaat.",
};

export default function PartiesPage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Organisation</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Parteien
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Parteien bündeln Kandidaturen und Programme. Mitgliedschaft ist
            exklusiv; während einer offenen Wahl ist sie eingefroren.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parties.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>

        <Card className="mt-10 border-dashed bg-surface/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">
                Eigene Partei gründen?
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Gründungen brauchen mindestens drei bestätigte Mitglieder und die
                Freigabe durch die Wahlleitung. Der Antrag läuft später über
                Discord.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-4 py-2 text-xs text-faint">
              Gründung folgt
            </span>
          </div>
        </Card>
      </Container>
    </>
  );
}
