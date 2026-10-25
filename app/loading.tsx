import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        Inhalt wird geladen …
      </div>

      <div aria-hidden="true">
        <Container className="py-12 sm:py-16">
          <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="mt-5 h-10 w-2/3 max-w-xl animate-pulse rounded-lg bg-surface-2" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-surface-2/70" />
          <div className="mt-2 h-4 w-5/6 max-w-xl animate-pulse rounded-full bg-surface-2/70" />

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-card border border-border bg-surface"
              />
            ))}
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-card border border-border bg-surface"
              />
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}
