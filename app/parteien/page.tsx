import type { Metadata } from "next";
import { PartyCard } from "@/components/party-card";
import { DemoNotice } from "@/components/demo-notice";
import { DiscordLink } from "@/components/discord-link";
import { Badge, buttonClasses, Container } from "@/components/ui";
import { getParties } from "@/lib/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Parteien",
  description: "Parteien, Programme und Vorsitz im Freistaat.",
};

export default async function PartiesPage() {
  const partyList = await getParties();

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
          {partyList.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>

        <DemoNotice
          className="mt-10"
          title="Eigene Partei gründen?"
          action={
            <DiscordLink
              label="Im Discord gründen"
              className={buttonClasses("secondary", "sm")}
            />
          }
        >
          Gründungen brauchen mindestens drei bestätigte Mitglieder und die
          Freigabe durch die Wahlleitung. Die Gründung läuft über den
          Discord-Server.
        </DemoNotice>
      </Container>
    </>
  );
}
