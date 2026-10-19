const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function daysUntil(iso: string): number {
  const difference = new Date(iso).getTime() - Date.now();
  return Math.ceil(difference / 86_400_000);
}

export function deadlineLabel(iso: string): string {
  const days = daysUntil(iso);

  if (days < 0) return "Beendet";
  if (days === 0) return "Endet heute";
  if (days === 1) return "Endet morgen";
  return `Endet in ${days} Tagen`;
}

export function electionDeadlineLabel(
  status: "candidacy" | "open" | "closed" | "published",
  candidacyEndsAt: string,
  votingEndsAt: string,
): string {
  if (status === "candidacy") {
    return `Bewerbung bis ${formatDate(candidacyEndsAt)}`;
  }
  if (status === "closed" || status === "published") return "Beendet";
  return deadlineLabel(votingEndsAt);
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
