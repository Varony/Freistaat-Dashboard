"use client";

import { IconCheck } from "@/components/icons";
import { buttonClasses, Progress } from "@/components/ui";
import { percent } from "@/lib/format";
import { setStoredValue, useStoredValue } from "@/lib/use-local-storage";

export function InitiativeSign({
  slug,
  initialSignatures,
  threshold,
}: {
  slug: string;
  initialSignatures: number;
  threshold: number;
}) {
  const storageKey = `freistaat:signature:${slug}`;
  const stored = useStoredValue(storageKey);
  const signed = stored === "1";
  const signatures = initialSignatures + (signed ? 1 : 0);

  function sign() {
    setStoredValue(storageKey, "1");
  }

  function reset() {
    setStoredValue(storageKey, null);
  }

  const progress = percent(signatures, threshold);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-text">
            {signatures}
            <span className="text-base font-normal text-faint"> / {threshold}</span>
          </p>
          <p className="mt-1 text-xs text-muted">Unterschriften</p>
        </div>
        <p className="text-xs text-faint">{progress}%</p>
      </div>

      <Progress
        value={signatures}
        max={threshold}
        tone={progress >= 100 ? "success" : "accent"}
        className="mt-3"
      />

      <div className="mt-5">
        {signed ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <IconCheck className="h-3.5 w-3.5" />
              Unterschrieben
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-faint underline underline-offset-4 transition-colors hover:text-text"
            >
              Zurücksetzen (Demo)
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={sign}
            className={buttonClasses("primary", "md", "w-full sm:w-auto")}
          >
            Jetzt unterschreiben
          </button>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-faint">
        Demo: Die Unterschrift wird nur lokal in diesem Browser gespeichert.
      </p>
    </div>
  );
}
