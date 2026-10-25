import Link from "next/link";
import { DiscordLink } from "@/components/discord-link";
import { buttonClasses, Container } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/30">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold tracking-tight text-text">
            {siteConfig.name}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {siteConfig.description}
          </p>
          <p className="mt-4 text-xs text-faint">
            {isSupabaseConfigured()
              ? "Stimmen und Unterschriften werden serverseitig bei Supabase gespeichert."
              : "Prototyp mit Beispieldaten. Es werden noch keine echten Stimmen gespeichert."}
          </p>
          <DiscordLink
            label="Discord-Server"
            className={buttonClasses("secondary", "sm", "mt-5")}
          />
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            Bereiche
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted transition-colors hover:text-text"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            Rechtliches
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/impressum"
                className="text-muted transition-colors hover:text-text"
              >
                Impressum
              </Link>
            </li>
            <li>
              <Link
                href="/datenschutz"
                className="text-muted transition-colors hover:text-text"
              >
                Datenschutz
              </Link>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-xs text-faint">
        <p>© {new Date().getFullYear()} Freistaat</p>
        <p>Gebaut für Demokratie-Simulationen im Discord.</p>
      </Container>
    </footer>
  );
}
