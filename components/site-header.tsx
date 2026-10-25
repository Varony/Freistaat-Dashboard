import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { DiscordLink } from "@/components/discord-link";
import { buttonClasses, Container } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Zur Startseite">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface-2 text-sm font-semibold text-text">
            F
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-text">
              {siteConfig.name}
            </span>
            <span className="hidden text-[11px] text-faint sm:block">
              {siteConfig.claim}
            </span>
          </span>
        </Link>

        <NavLinks className="hidden md:flex" />

        <div className="hidden items-center gap-2 md:flex">
          <DiscordLink
            label="Discord"
            className={buttonClasses("secondary", "sm")}
          />
          <Link href="/profil" className={buttonClasses("ghost", "sm")}>
            Anmelden
          </Link>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
