import Link from "next/link";
import { Container, buttonClasses } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] max-w-2xl flex-col items-start justify-center py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        Diese Seite gibt es nicht.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Vielleicht wurde der Eintrag verschoben oder die Wahl ist bereits im
        Archiv.
      </p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Zur Übersicht
      </Link>
    </Container>
  );
}
