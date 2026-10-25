import Link from "next/link";
import { IconArrowRight, IconUsers } from "@/components/icons";
import { Avatar, Badge, Card } from "@/components/ui";
import { electionDeadlineLabel } from "@/lib/format";
import { electionStatusMeta } from "@/lib/labels";
import type { Election, Party } from "@/lib/types";

export function ElectionCard({
  election,
  parties,
}: {
  election: Election;
  parties: Party[];
}) {
  const status = electionStatusMeta[election.status];
  const partyById = new Map(parties.map((party) => [party.id, party]));
  const meta =
    election.type === "rat"
      ? `${election.seats ?? 0} Sitze · ${election.parties?.length ?? 0} Listen`
      : election.type === "referendum"
        ? "Ja / Nein"
        : `${election.candidates.length} Kandidaturen`;

  return (
    <Card className="group flex h-full flex-col p-5 transition-colors hover:border-border/80 hover:bg-surface-2/40">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="text-xs text-faint">
          {electionDeadlineLabel(
            election.status,
            election.candidacyEndsAt,
            election.votingEndsAt,
          )}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-text">
        <Link href={`/wahlen/${election.slug}`} className="hover:underline">
          {election.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-faint">
        {election.office}
      </p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {election.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {election.candidates.slice(0, 4).map((candidate) => {
              const party = partyById.get(candidate.partyId ?? "");
              return (
                <span
                  key={candidate.id}
                  title={party ? `${candidate.name} · ${party.shortName}` : candidate.name}
                >
                  <Avatar
                    initials={candidate.initials}
                    size="sm"
                    className="ring-2 ring-surface"
                  />
                </span>
              );
            })}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <IconUsers className="h-3.5 w-3.5" />
            {meta}
          </span>
        </div>

        <Link
          href={`/wahlen/${election.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-text"
        >
          Ansehen
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
