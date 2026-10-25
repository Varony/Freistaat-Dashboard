import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconArrowRight,
  IconShield,
  IconUsers,
  IconVote,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Card,
  Container,
  EmptyState,
  SectionHeading,
  buttonClasses,
} from "@/components/ui";
import { DiscordLink } from "@/components/discord-link";
import { DemoNotice } from "@/components/demo-notice";
import { electionStatusMeta } from "@/lib/labels";
import { getElections, getParty, parties } from "@/lib/mock-data";

export const revalidate = 300;

export function generateStaticParams() {
  return parties.map((party) => ({ slug: party.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const party = getParty(slug);

  if (!party) return { title: "Partei" };

  return {
    title: party.name,
    description: party.program,
    openGraph: {
      title: party.name,
      description: party.program,
    },
  };
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = getParty(slug);

  if (!party) notFound();

  const electionList = getElections();
  const candidacies = electionList.flatMap((election) =>
    election.candidates
      .filter((candidate) => candidate.partyId === party.id)
      .map((candidate) => ({ election, candidate })),
  );

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/parteien"
        className="inline-flex items-center gap-1 text-xs text-faint transition-colors hover:text-text"
      >
        ← Alle Parteien
      </Link>

      <div className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: party.color }}
            aria-hidden="true"
          />
          <Badge>Partei</Badge>
          <span className="text-xs text-faint">{party.shortName}</span>
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-text sm:text-5xl">
          {party.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {party.program}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconShield className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Vorsitz</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">{party.leader}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconUsers className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Mitglieder</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">{party.members}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconVote className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Kandidaturen</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">
            {candidacies.length}
          </p>
        </Card>
      </div>

      <section className="mt-12">
        <SectionHeading
          eyebrow="Wahlen"
          title="Kandidaturen"
          description="Alle Wahlen, bei denen die Partei antritt – mit dem jeweiligen Stand."
        />

        {candidacies.length > 0 ? (
          <div className="mt-5 space-y-3">
            {candidacies.map(({ election, candidate }) => {
              const status = electionStatusMeta[election.status];

              return (
                <Card key={`${election.id}-${candidate.id}`} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <Avatar initials={candidate.initials} />
                      <div>
                        <p className="text-sm font-medium text-text">
                          {candidate.name}
                        </p>
                        <p className="mt-0.5 text-xs text-faint">
                          {election.title}
                          {candidate.listPosition && election.type === "rat"
                            ? ` · Listenplatz ${candidate.listPosition}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  {candidate.statement ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      {candidate.statement}
                    </p>
                  ) : null}

                  <Link
                    href={`/wahlen/${election.slug}`}
                    className={buttonClasses("secondary", "sm", "mt-4")}
                  >
                    Zur Wahl
                    <IconArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Noch keine Kandidaturen"
            description="Diese Partei tritt derzeit bei keiner Wahl an."
          />
        )}
      </section>

      <DemoNotice
        className="mt-12"
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
  );
}
