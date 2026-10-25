import type {
  Election,
  ElectionStatus,
  Initiative,
  InitiativeStatus,
} from "./types";

function timestamp(value: string): number {
  return new Date(value).getTime();
}

/**
 * Leitet den Status aus den Fristen ab, statt ihn in den Mock-Daten zu pflegen.
 * Referenden kennen keine Bewerbungsphase und sind bis zum Ende offen.
 */
export function deriveElectionStatus(
  election: Election,
  now: Date = new Date(),
): ElectionStatus {
  const current = now.getTime();
  const hasResult = Boolean(election.result?.length);

  if (election.type !== "referendum" && current < timestamp(election.candidacyEndsAt)) {
    return "candidacy";
  }

  if (current < timestamp(election.votingEndsAt)) return "open";

  return hasResult ? "published" : "closed";
}

/**
 * Eine abgelehnte Initiative bleibt abgelehnt. Ansonsten entscheiden die
 * Unterschriften und die Frist.
 */
export function deriveInitiativeStatus(
  initiative: Initiative,
  now: Date = new Date(),
): InitiativeStatus {
  if (initiative.status === "rejected") return "rejected";
  if (initiative.signatures >= initiative.threshold) return "qualified";
  if (now.getTime() >= timestamp(initiative.endsAt)) return "expired";

  return "collecting";
}
