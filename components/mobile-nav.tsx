"use client";

import Link from "next/link";
import { useState } from "react";
import { IconMenu, IconX } from "@/components/icons";
import { buttonClasses } from "@/components/ui";
import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-text"
      >
        {open ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
      </button>

      {open ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-16 z-40 border-b border-border bg-bg p-5 shadow-2xl shadow-black/40"
        >
          <NavLinks
            className="flex flex-col items-stretch gap-1"
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className={buttonClasses("secondary", "md", "mt-4 w-full")}
          >
            Mit Discord anmelden
          </Link>
        </div>
      ) : null}
    </div>
  );
}
