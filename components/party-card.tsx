import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { Card } from "@/components/ui";
import type { Party } from "@/lib/types";

export function PartyCard({ party }: { party: Party }) {
  return (
    <Link
      href={`/parteien/${party.id}`}
      aria-label={`${party.name} – Details ansehen`}
      className="group block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-border/80 group-hover:bg-surface-2/40">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: party.color }}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-text">
              {party.name}
            </h3>
            <p className="text-[11px] uppercase tracking-[0.16em] text-faint">
              {party.shortName}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
          {party.program}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
          <div>
            <dt className="text-faint">Vorsitz</dt>
            <dd className="mt-0.5 text-text">{party.leader}</dd>
          </div>
          <div>
            <dt className="text-faint">Mitglieder</dt>
            <dd className="mt-0.5 text-text">{party.members}</dd>
          </div>
        </dl>

        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-text">
          Profil ansehen
          <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
