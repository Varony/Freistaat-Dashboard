import type { Metadata } from "next";
import { DiscordLink } from "@/components/discord-link";
import { IconCheck, IconShield, IconUsers, IconVote } from "@/components/icons";
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  Container,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Profil",
  description: "Eigenes Profil, Partei und Stimmnachweise.",
};

export default function ProfilePage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <Badge tone="accent">Konto</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Profil
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Die Anmeldung über Discord ist noch nicht angeschlossen. Danach
            kannst du abstimmen, unterschreiben und kandidieren.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar initials="G" size="lg" />
              <div>
                <p className="text-lg font-semibold tracking-tight text-text">
                  Gast
                </p>
                <p className="text-sm text-muted">Nicht angemeldet</p>
              </div>
              <Badge className="ml-auto" tone="warning">
                Demo
              </Badge>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm font-medium text-text">
                Anmeldung über Discord
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Die Anmeldung ist noch nicht angeschlossen. Im nächsten Ausbau
                meldest du dich mit deinem Discord-Konto an; der Bot prüft deine
                Rolle als Bürger.
              </p>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast opacity-40"
              >
                Anmeldung folgt
              </button>
              <p className="mt-3 text-xs leading-relaxed text-faint">
                Demo: Die Anmeldung ist noch nicht angeschlossen. Der
                Discord-Server ist bereits offen.
              </p>
              <DiscordLink
                label="Discord beitreten"
                className={buttonClasses("secondary", "sm", "mt-4")}
              />
            </div>
          </Card>

          <div className="space-y-3">
            {[
              {
                icon: <IconVote className="h-4 w-4" />,
                title: "Abstimmen",
                text: "Eine Stimme pro Wahl, anonym und nachvollziehbar.",
              },
              {
                icon: <IconUsers className="h-4 w-4" />,
                title: "Unterschreiben",
                text: "Bürgerbegehren unterstützen und Fortschritt verfolgen.",
              },
              {
                icon: <IconShield className="h-4 w-4" />,
                title: "Kandidieren",
                text: "Programm einreichen und zur Wahl antreten.",
              },
            ].map((item) => (
              <Card key={item.title} className="flex gap-3 p-4">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-faint">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </Card>
            ))}

            <Card className="border-success/30 bg-success/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-text">
                <IconCheck className="h-4 w-4 text-success" />
                Rolle „Bürger“
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Voraussetzung für Wahlen und Bürgerbegehren.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
