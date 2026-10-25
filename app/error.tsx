"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container, buttonClasses } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] max-w-2xl flex-col items-start justify-center py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
        Fehler
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        Da ist etwas schiefgelaufen.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Die Seite konnte nicht geladen werden. Versuch es noch einmal – wenn der
        Fehler bleibt, hilft ein Blick in den Discord-Server.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonClasses("primary", "md")}
        >
          Erneut versuchen
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Zur Übersicht
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-6 text-xs text-faint">Fehler-ID: {error.digest}</p>
      ) : null}
    </Container>
  );
}
