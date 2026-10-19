import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconFile,
  IconUsers,
  IconX,
} from "@/components/icons";
import { InitiativeSign } from "@/components/initiative-sign";
import {
  Badge,
  buttonClasses,
  Card,
  Container,
  Progress,
} from "@/components/ui";
import { formatDate, percent } from "@/lib/format";
import { initiativeStatusMeta } from "@/lib/labels";
import {
  getElection,
  getInitiative,
  initiatives,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return initiatives.map((initiative) => ({ slug: initiative.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const initiative = getInitiative(slug);
  return { title: initiative?.title ?? "Bürgerbegehren" };
}

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initiative = getInitiative(slug);

  if (!initiative) notFound();

  const status = initiativeStatusMeta[initiative.status];
  const isCollecting = initiative.status === "collecting";
  const isQualified = initiative.status === "qualified";
  const progress = percent(initiative.signatures, initiative.threshold);

  const referendum = initiative.referendumSlug
    ? getElection(initiative.referendumSlug)
    : undefined;

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/buergerbegehren"
        className="inline-flex items-center gap-1 text-xs text-faint transition-colors hover:text-text"
      >
        ← Alle Bürgerbegehren
      </Link>

      <div className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-xs text-faint">
            {initiative.signatures} von {initiative.threshold} Unterschriften
          </span>
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-text sm:text-5xl">
          {initiative.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {initiative.summary}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconUsers className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Eingereicht von</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">{initiative.author}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconCalendar className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Eingereicht am</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">
            {formatDate(initiative.createdAt)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-faint">
            <IconFile className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.14em]">Frist</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">
            {formatDate(initiative.endsAt)}
          </p>
        </Card>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            {isCollecting ? (
              <>
                <p className="text-sm font-medium text-text">
                  Dieses Begehren unterstützen
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Eine Unterschrift pro Bürger. Bei Erreichen der Schwelle wird
                  automatisch eine Volksabstimmung angesetzt.
                </p>
                <div className="mt-5">
                  <InitiativeSign
                    slug={initiative.slug}
                    initialSignatures={initiative.signatures}
                    threshold={initiative.threshold}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-text">
                      {initiative.signatures}
                      <span className="text-base font-normal text-faint">
                        {" "}
                        / {initiative.threshold}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">Unterschriften</p>
                  </div>
                  <p className="text-xs text-faint">{progress}%</p>
                </div>
                <Progress
                  value={initiative.signatures}
                  max={initiative.threshold}
                  tone={isQualified ? "success" : "danger"}
                  className="mt-3"
                />

                {isQualified ? (
                  <div className="mt-5 rounded-xl border border-success/30 bg-success/5 p-4">
                    <p className="text-sm font-medium text-text">
                      Schwelle erreicht
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Das Begehren ist qualifiziert und wird als Volksabstimmung
                      zur Entscheidung vorgelegt.
                    </p>
                    {referendum ? (
                      <Link
                        href={`/wahlen/${referendum.slug}`}
                        className={buttonClasses("primary", "sm", "mt-4")}
                      >
                        Zur Volksabstimmung
                        <IconArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted">
                    Die Frist ist abgelaufen. Es wurden nicht genügend
                    Unterschriften erreicht.
                  </p>
                )}
              </>
            )}
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-text">
              Begründung
            </h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
              {initiative.text}
            </div>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              Ablauf
            </p>
            <ol className="mt-4 space-y-4">
              {[
                {
                  title: "Eingereicht",
                  detail: formatDate(initiative.createdAt),
                  done: true,
                  current: false,
                  failed: false,
                },
                {
                  title: "Unterschriften",
                  detail: isCollecting
                    ? `bis ${formatDate(initiative.endsAt)}`
                    : isQualified
                      ? "Schwelle erreicht"
                      : "Frist abgelaufen",
                  done: isQualified,
                  current: isCollecting,
                  failed: !isCollecting && !isQualified,
                },
                {
                  title: "Volksabstimmung",
                  detail: isQualified
                    ? "wird angesetzt"
                    : isCollecting
                      ? "nach Erreichen der Schwelle"
                      : "nicht erreicht",
                  done: isQualified,
                  current: isQualified,
                  failed: !isCollecting && !isQualified,
                },
              ].map((step) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                      step.done
                        ? "border-success/40 bg-success/10 text-success"
                        : step.failed
                          ? "border-danger/40 bg-danger/10 text-danger"
                          : step.current
                            ? "border-accent/60 bg-accent/10 text-accent"
                            : "border-border bg-surface-2 text-faint",
                    )}
                  >
                    {step.done ? (
                      <IconCheck className="h-3 w-3" />
                    ) : step.failed ? (
                      <IconX className="h-3 w-3" />
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
            <p className="text-sm font-medium text-text">Schwelle</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {initiative.threshold} Unterschriften. Die Zahl wird beim Anlegen
              festgehalten und ändert sich nicht nachträglich.
            </p>
          </Card>

          <Card className="border-dashed bg-surface/40 p-5">
            <p className="text-sm font-medium text-text">Prototyp</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Unterschriften werden nur lokal im Browser simuliert.
            </p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
