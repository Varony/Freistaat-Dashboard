"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";
import { buttonClasses, Card } from "@/components/ui";
import { setStoredValue, useStoredValue } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";

export type VoteOption = {
  id: string;
  label: string;
  hint?: string;
  initials?: string;
  color?: string;
};

export function VoteForm({
  electionSlug,
  options,
  legend,
}: {
  electionSlug: string;
  options: VoteOption[];
  legend: string;
}) {
  const storageKey = `freistaat:vote:${electionSlug}`;
  const [selected, setSelected] = useState<string | null>(null);
  const stored = useStoredValue(storageKey);
  const voted =
    stored && options.some((option) => option.id === stored) ? stored : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setStoredValue(storageKey, selected);
  }

  function reset() {
    setStoredValue(storageKey, null);
    setSelected(null);
  }

  const votedOption = options.find((option) => option.id === voted);

  if (votedOption) {
    return (
      <Card className="border-success/30 bg-success/5 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <IconCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text">Stimme abgegeben</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Deine Auswahl: <span className="text-text">{votedOption.label}</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-faint">
              Demo: Die Stimme wird nur lokal in diesem Browser gespeichert und
              nicht an den Freistaat übertragen.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 text-xs font-medium text-muted underline underline-offset-4 transition-colors hover:text-text"
            >
              Auswahl zurücksetzen
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-text">{legend}</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const active = selected === option.id;

            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-accent/40",
                  active
                    ? "border-accent/60 bg-accent/5"
                    : "border-border bg-surface-2/30 hover:border-border/80 hover:bg-surface-2/60",
                )}
              >
                <input
                  type="radio"
                  name="vote"
                  value={option.id}
                  checked={active}
                  onChange={() => setSelected(option.id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-accent" : "border-border",
                  )}
                  aria-hidden="true"
                >
                  {active ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                </span>

                {option.initials ? (
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-xs font-medium text-muted"
                    aria-hidden="true"
                  >
                    {option.initials}
                  </span>
                ) : null}

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text">
                    {option.label}
                  </span>
                  {option.hint ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                      {option.hint}
                    </span>
                  ) : null}
                </span>

                {option.color ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                    aria-hidden="true"
                  />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!selected}
          className={buttonClasses("primary", "md")}
        >
          Stimme abgeben
        </button>
        <p className="text-xs text-faint">
          Demo – es wird keine echte Stimme gespeichert.
        </p>
      </div>
    </form>
  );
}
