import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { IconExternal, IconFile } from "@/components/icons";
import { Badge, Card, Container } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getLawBook } from "@/lib/laws";

export const metadata: Metadata = {
  title: "Gesetze",
  description: "Das Gesetzblatt des Freistaats.",
};

const linkClasses =
  "underline decoration-border underline-offset-4 transition-colors hover:text-text hover:decoration-accent";

export default async function LawsPage() {
  const { laws, syncedFromDiscord, channelName, sourceUrl } =
    await getLawBook();

  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Gesetzblatt</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Gesetze
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Alle Beschlüsse des Freistaats an einem Ort.{" "}
            {syncedFromDiscord ? (
              <>
                Das Gesetzblatt wird automatisch aus Discord synchronisiert
                {sourceUrl ? (
                  <>
                    {" "}
                    – Quelle:{" "}
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClasses}
                    >
                      {channelName ? `#${channelName}` : "Gesetzblatt"}
                    </a>
                  </>
                ) : null}
                .
              </>
            ) : (
              "Der Discord-Sync ist noch nicht aktiv; aktuell werden Beispieldaten angezeigt."
            )}
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit lg:sticky lg:top-24">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              Inhalt
            </p>
            <nav className="mt-4" aria-label="Gesetzesübersicht">
              <ul className="space-y-2 border-l border-border pl-4">
                {laws.map((law) => (
                  <li key={law.id}>
                    <a
                      href={`#${law.id}`}
                      className="block text-sm leading-snug text-muted transition-colors hover:text-text"
                    >
                      {law.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <Card className="mt-6 border-dashed bg-surface/40 p-4">
              <div className="flex items-center gap-2 text-faint">
                <IconFile className="h-3.5 w-3.5" />
                <p className="text-[11px] uppercase tracking-[0.14em]">Quelle</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                <code className="rounded border border-border bg-surface-2 px-1 py-0.5">
                  content/Gesetze.md
                </code>
              </p>
              {syncedFromDiscord && sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
                >
                  Discord-Channel öffnen
                  <IconExternal className="h-3 w-3" />
                </a>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-faint">
                {syncedFromDiscord
                  ? "Wird automatisch aus Discord synchronisiert."
                  : "Der Discord-Sync ist vorbereitet, aber noch nicht aktiv. Aktuell werden Beispieldaten angezeigt."}
              </p>
            </Card>
          </aside>

          <div className="space-y-14">
            {laws.map((law) => (
              <article key={law.id} id={law.id} className="scroll-mt-24">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <h2 className="text-center text-lg font-semibold tracking-tight text-text sm:text-xl">
                    {law.title}
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {law.passedAt || law.sourceUrl ? (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-faint">
                    {law.passedAt ? (
                      <time dateTime={law.passedAt}>
                        Beschlossen am {formatDate(law.passedAt)}
                      </time>
                    ) : null}
                    {law.sourceUrl ? (
                      <a
                        href={law.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline decoration-border underline-offset-4 transition-colors hover:text-text hover:decoration-accent"
                      >
                        Im Discord ansehen
                        <IconExternal className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ) : null}

                <div className="law-prose mt-5">
                  <ReactMarkdown>{law.body}</ReactMarkdown>
                </div>
              </article>
            ))}

            <p className="border-t border-border pt-6 text-xs text-faint">
              Das Gesetzblatt wird automatisch aus Discord erzeugt. Verbindlich
              sind die Beschlüsse im Discord-Server.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
