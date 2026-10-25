import type { ReactNode } from "react";

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[0.92em] text-warning">
      {children}
    </span>
  );
}
