import type {
  Election,
  ElectionResult,
  ElectionStatus,
  Initiative,
  InitiativeStatus,
} from "./types";

function timestamp(value: string): number {
  return new Date(value).getTime();
}

type ElectionTiming = Pick<
  Election,
  "type" | "candidacyEndsAt" | "votingEndsAt"
> & {
  result?: ElectionResult[];
  resultsPublic?: boolean;
};

/**
 * Leitet den Status aus den Fristen ab, statt ihn in den Daten zu pflegen.
 * Referenden kennen keine Bewerbungsphase und sind bis zum Ende offen.
 */
export function deriveElectionStatus(
  election: ElectionTiming,
  now: Date = new Date(),
): ElectionStatus {
  const current = now.getTime();
  const published =
    election.resultsPublic ?? Boolean(election.result?.length);

  if (election.type !== "referendum" && current < timestamp(election.candidacyEndsAt)) {
    return "candidacy";
  }

  if (current < timestamp(election.votingEndsAt)) return "open";

  return published ? "published" : "closed";
}

type InitiativeProgress = Pick<
  Initiative,
  "signatures" | "threshold" | "endsAt"
> & {
  status?: InitiativeStatus;
};

/**
 * Eine abgelehnte Initiative bleibt abgelehnt. Ansonsten entscheiden die
 * Unterschriften und die Frist.
 */
export function deriveInitiativeStatus(
  initiative: InitiativeProgress,
  now: Date = new Date(),
): InitiativeStatus {
  if (initiative.status === "rejected") return "rejected";
  if (initiative.signatures >= initiative.threshold) return "qualified";
  if (now.getTime() >= timestamp(initiative.endsAt)) return "expired";

  return "collecting";
}
