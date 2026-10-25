import type { ElectionStatus, InitiativeStatus } from "./types";

type Tone = "default" | "success" | "warning" | "danger" | "accent";

export const electionStatusMeta: Record<
  ElectionStatus,
  { label: string; tone: Tone }
> = {
  candidacy: { label: "Bewerbungsphase", tone: "warning" },
  open: { label: "Abstimmung läuft", tone: "success" },
  closed: { label: "Abgeschlossen", tone: "default" },
  published: { label: "Veröffentlicht", tone: "default" },
};

export const initiativeStatusMeta: Record<
  InitiativeStatus,
  { label: string; tone: Tone }
> = {
  collecting: { label: "Sammelt Unterschriften", tone: "warning" },
  qualified: { label: "Qualifiziert", tone: "success" },
  expired: { label: "Frist abgelaufen", tone: "default" },
  rejected: { label: "Abgelehnt", tone: "danger" },
};
