import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconCalendar,
  IconCheck,
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
  Progress,
  buttonClasses,
} from "@/components/ui";
import { VoteForm, type VoteOption } from "@/components/vote-form";
import { DiscordLink } from "@/components/discord-link";
import { getElection, getParties } from "@/lib/data";
import { deadlineLabel, formatDate, percent } from "@/lib/format";
import { electionStatusMeta } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const election = await getElection(slug);

  if (!election) return { title: "Wahl" };

  return {
    title: election.title,
    description: election.description,
    openGraph: {
      title: election.title,
      description: election.description,
    },
  };
}

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [election, partyList] = await Promise.all([
    getElection(slug),
    getParties(),
  ]);

  if (!election) notFound();

  const partyById = new Map(partyList.map((party) => [party.id, party]));
  const configured = isSupabaseConfigured();
  let authenticated = false;
  let existingVote: string | null = null;

  if (configured) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = Boolean(user);

    if (user) {
      const { data: vote } = await supabase
        .from("votes")
        .select("option_id")
        .eq("election_id", election.id)
        .eq("user_id", user.id)
        .maybeSingle();

      existingVote = vote?.option_id ?? null;
    }
  }

  const status = electionStatusMeta[election.status];
  const isOpen = election.status === "open";
  const isClosed = election.status === "closed" || election.status === "published";
  const hasResult = Boolean(election.result?.length);
  const totalVotes = election.result?.reduce((sum, item) => sum + item.votes, 0) ?? 0;

  const voteOptions: VoteOption[] =
    election.type === "rat"
      ? (election.parties ?? []).map((partyId) => {
          const party = partyById.get(partyId);
          const list = election.candidates
            .filter((candidate) => candidate.partyId === partyId)
            .sort((a, b) => (a.listPosition ?? 0) - (b.listPosition ?? 0));

          return {
            id: partyId,
            label: party?.name ?? partyId,
            hint: list.length
              ? `Liste: ${list.map((candidate) => candidate.name).join(", ")}`
              : undefined,
            color: party?.color,
          };
        })
      : election.candidates.map((candidate) => {
          const party = partyById.get(candidate.partyId ?? "");
          return {
            id: candidate.id,
            label: candidate.name,
            hint: [party?.shortName, candidate.statement]
              .filter(Boolean)
              .join(" · "),
            initials: candidate.initials,
          };
        });

  const steps =
    election.type === "referendum"
      ? [
          {
            title: "Qualifiziert",
            detail: "durch ein Bürgerbegehren",
            done: true,
            current: false,
          },
          {
            title: "Abstimmung",
            detail: `bis ${formatDate(election.votingEndsAt)}`,
            done: isClosed,
            current: election.status === "open",
          },
          {
            title: "Ergebnis",
            detail: hasResult
              ? "veröffentlicht"
              : isClosed
                ? "wird ausgezählt"
                : "nach Ende der Abstimmung",
            done: hasResult,
            current: isClosed && !hasResult,
          },
        ]
      : [
          {
            title: "Bewerbung",
            detail:
              election.status === "candidacy"
                ? `läuft bis ${formatDate(election.candidacyEndsAt)}`
                : `abgeschlossen am ${formatDate(election.candidacyEndsAt)}`,
            done: election.status !== "candidacy",
            current: election.status === "candidacy",
          },
          {
            title: "Abstimmung",
            detail:
              election.status === "candidacy"
                ? `startet nach dem ${formatDate(election.candidacyEndsAt)}`
                : `bis ${formatDate(election.votingEndsAt)}`,
            done: isClosed,
            current: election.status === "open",
          },
          {
            title: "Ergebnis",
            detail: hasResult
              ? "veröffentlicht"
              : isClosed
                ? "wird ausgezählt"
                : "nach Ende der Abstimmung",
            done: hasResult,
            current: isClosed && !hasResult,
          },
        ];

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/wahlen"
        className="inline-flex items-center gap-1 text-xs text-faint transition-colors hover:text-text"
      >
        ← Alle Wahlen
      </Link>

      <div className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-xs text-faint">
            {election.status === "candidacy"
              ? `Bewerbung bis ${formatDate(election.candidacyEndsAt)}`
              : election.status === "open"
                ? deadlineLabel(election.votingEndsAt)
                : "Beendet"}
          </span>
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-text sm:text-5xl">
          {election.title}
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.16em] text-faint">
          {election.office}
        </p>
        <p className="mt-5 text-base leading-relaxed text-muted">
          {election.description}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label:
              election.status === "candidacy"
                ? "Bewerbung bis"
                : election.status === "open"
                  ? "Abstimmung bis"
                  : "Beendet am",
            value: formatDate(
              election.status === "candidacy"
                ? election.candidacyEndsAt
                : election.votingEndsAt,
            ),
            icon: <IconCalendar className="h-4 w-4" />,
          },
          {
            label: "Wahlberechtigt",
            value: `${election.eligibleVoters} Bürger`,
            icon: <IconUsers className="h-4 w-4" />,
          },
          {
            label: "Verfahren",
            value:
              election.type === "rat"
                ? `Ratswahl · ${election.seats ?? 0} Sitze`
                : election.type === "referendum"
                  ? "Volksabstimmung"
                  : "Personenwahl",
            icon: <IconVote className="h-4 w-4" />,
          },
          {
            label:
              election.type === "referendum" ? "Optionen" : "Kandidaturen",
            value: String(election.candidates.length),
            icon: <IconShield className="h-4 w-4" />,
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center gap-2 text-faint">
              {item.icon}
              <p className="text-[11px] uppercase tracking-[0.14em]">{item.label}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-text">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold tracking-tight text-text">
              {election.type === "rat"
                ? "Listen und Kandidaturen"
                : election.type === "referendum"
                  ? "Zur Abstimmung"
                  : "Kandidaturen"}
            </h2>

            {election.type === "rat" ? (
              <div className="mt-5 space-y-3">
                {(election.parties ?? []).map((partyId) => {
                  const party = partyById.get(partyId);
                  const list = election.candidates
                    .filter((candidate) => candidate.partyId === partyId)
                    .sort((a, b) => (a.listPosition ?? 0) - (b.listPosition ?? 0));

                  return (
                    <Card key={partyId} className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: party?.color }}
                          aria-hidden="true"
                        />
                        <p className="text-sm font-semibold text-text">
                          {party?.name ?? partyId}
                        </p>
                        <Badge>{party?.shortName}</Badge>
                      </div>
                      <ol className="mt-4 space-y-3">
                        {list.map((candidate, index) => (
                          <li key={candidate.id} className="flex gap-3">
                            <span className="mt-1 w-5 shrink-0 text-xs text-faint">
                              {index + 1}.
                            </span>
                            <Avatar initials={candidate.initials} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-text">
                                {candidate.name}
                              </p>
                              {candidate.statement ? (
                                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                                  {candidate.statement}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {election.candidates.map((candidate) => {
                  const party = partyById.get(candidate.partyId ?? "");

                  return (
                    <div
                      key={candidate.id}
                      className="flex gap-3 rounded-xl border border-border bg-surface p-4"
                    >
                      <Avatar initials={candidate.initials} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-text">
                            {candidate.name}
                          </p>
                          {party ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: party.color }}
                                aria-hidden="true"
                              />
                              {party.shortName}
                            </span>
                          ) : null}
                        </div>
                        {candidate.statement ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {candidate.statement}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-text">
              {isClosed ? "Ergebnis" : "Stimmabgabe"}
            </h2>

            {isClosed ? (
              election.result && election.result.length > 0 ? (
                <Card className="mt-5 p-6">
                  <div className="space-y-5">
                    {election.result.map((item) => {
                      const candidate = election.candidates.find(
                        (entry) => entry.id === item.candidateId,
                      );
                      const share = percent(item.votes, totalVotes);

                      return (
                        <div key={item.candidateId}>
                          <div className="flex items-end justify-between gap-3 text-sm">
                            <span className="font-medium text-text">
                              {candidate?.name ??
                                partyById.get(item.candidateId)?.name ??
                                item.candidateId}
                            </span>
                            <span className="text-xs text-faint">
                              {item.votes} Stimmen · {share}%
                            </span>
                          </div>
                          <Progress
                            value={item.votes}
                            max={totalVotes}
                            tone="success"
                            className="mt-2"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {typeof election.turnout === "number" ? (
                    <p className="mt-6 border-t border-border pt-4 text-xs text-faint">
                      Wahlbeteiligung: {election.turnout} von {election.eligibleVoters}{" "}
                      Bürgern ({percent(election.turnout, election.eligibleVoters)}%).
                    </p>
                  ) : null}
                </Card>
              ) : (
                <EmptyState
                  title="Noch kein Ergebnis veröffentlicht"
                  description="Die Auszählung wird nach Abschluss der Wahl veröffentlicht."
                />
              )
            ) : isOpen ? (
              <Card className="mt-5 p-6">
                <VoteForm
                  electionSlug={election.slug}
                  options={voteOptions}
                  mode={configured ? "live" : "demo"}
                  isAuthenticated={authenticated}
                  initialVote={existingVote}
                  legend={
                    election.type === "rat"
                      ? "Welche Liste soll den Rat bilden?"
                      : election.type === "referendum"
                        ? "Wie stimmst du ab?"
                        : "Wen wählst du?"
                  }
                />
              </Card>
            ) : (
              <Card className="mt-5 border-warning/30 bg-warning/5 p-6">
                <p className="text-sm font-medium text-text">
                  Die Bewerbungsphase läuft.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Die Abstimmung beginnt am {formatDate(election.candidacyEndsAt)}.
                  Bis dahin können Kandidaturen eingereicht und geprüft werden.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <DiscordLink
                    label="Im Discord bewerben"
                    className={buttonClasses("secondary", "sm")}
                  />
                  <span className="text-xs text-faint">
                    Demo – die Einreichung über die Website folgt.
                  </span>
                </div>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              Ablauf
            </p>
            <ol className="mt-4 space-y-4">
              {steps.map((step) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                      step.done
                        ? "border-success/40 bg-success/10 text-success"
                        : step.current
                          ? "border-accent/60 bg-accent/10 text-accent"
                          : "border-border bg-surface-2 text-faint",
                    )}
                  >
                    {step.done ? (
                      <IconCheck className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-text">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-text">Wer darf wählen?</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Alle Bürger mit der Discord-Rolle „Bürger“, die vor Beginn der Wahl
              beigetreten sind. Das Wählerverzeichnis wird beim Öffnen eingefroren.
            </p>
          </Card>

          <Card className="border-dashed bg-surface/40 p-5">
            <p className="text-sm font-medium text-text">Prototyp</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Diese Seite nutzt Beispieldaten. Eine abgegebene Stimme wird nur
              lokal im Browser gespeichert.
            </p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
