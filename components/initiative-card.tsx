import Link from "next/link";
import { Badge, Card, Progress } from "@/components/ui";
import { deadlineLabel, percent } from "@/lib/format";
import { initiativeStatusMeta } from "@/lib/labels";
import type { Initiative } from "@/lib/types";

export function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const status = initiativeStatusMeta[initiative.status];
  const progress = percent(initiative.signatures, initiative.threshold);
  const deadline =
    initiative.status === "qualified"
      ? "Bereit zur Abstimmung"
      : deadlineLabel(initiative.endsAt);

  return (
    <Card className="group flex h-full flex-col p-5 transition-colors hover:border-border/80 hover:bg-surface-2/40">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="text-xs text-faint">{deadline}</span>
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-text">
        <Link href={`/buergerbegehren/${initiative.slug}`} className="hover:underline">
          {initiative.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
        {initiative.summary}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 text-xs">
          <span className="text-muted">
            <span className="font-medium text-text">{initiative.signatures}</span>
            {" / "}
            {initiative.threshold} Unterschriften
          </span>
          <span className="text-faint">{progress}%</span>
        </div>
        <Progress
          value={initiative.signatures}
          max={initiative.threshold}
          tone={progress >= 100 ? "success" : "accent"}
          className="mt-2"
        />
      </div>
    </Card>
  );
}
