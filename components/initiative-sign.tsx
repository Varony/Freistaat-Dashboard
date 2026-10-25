"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInitiative,
  type InitiativeState,
} from "@/app/buergerbegehren/[slug]/actions";
import { IconCheck } from "@/components/icons";
import { buttonClasses, Card, Progress } from "@/components/ui";
import { percent } from "@/lib/format";
import { setStoredValue, useStoredValue } from "@/lib/use-local-storage";

const initialState: InitiativeState = { status: "idle" };

export function InitiativeSign({
  slug,
  initialSignatures,
  threshold,
  mode,
  isAuthenticated,
  initialSigned,
}: {
  slug: string;
  initialSignatures: number;
  threshold: number;
  mode: "live" | "demo";
  isAuthenticated: boolean;
  initialSigned: boolean;
}) {
  const storageKey = `freistaat:signature:${slug}`;
  const stored = useStoredValue(storageKey);
  const [state, formAction, pending] = useActionState(
    signInitiative,
    initialState,
  );

  const demoSigned = stored === "1";
  const signed = mode === "demo" ? demoSigned : initialSigned || state.status === "success";
  const liveJustSigned = mode === "live" && state.status === "success" && !initialSigned;
  const signatures =
    mode === "demo"
      ? initialSignatures + (demoSigned ? 1 : 0)
      : initialSignatures + (liveJustSigned ? 1 : 0);
  const progress = percent(signatures, threshold);

  function sign() {
    setStoredValue(storageKey, "1");
  }

  function reset() {
    setStoredValue(storageKey, null);
  }

  if (mode === "live" && !isAuthenticated && !signed) {
    return (
      <Card className="border-dashed bg-surface/40 p-6">
        <p className="text-sm font-semibold text-text">
          Anmeldung erforderlich
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Unterschriften werden serverseitig gespeichert. Melde dich mit Discord
          an, um dieses Bürgerbegehren zu unterstützen.
        </p>
        <Link
          href="/profil"
          className={buttonClasses("secondary", "sm", "mt-4")}
        >
          Mit Discord anmelden
        </Link>
      </Card>
    );
  }

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
            {mode === "demo" ? (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-faint underline underline-offset-4 transition-colors hover:text-text"
              >
                Zurücksetzen (Demo)
              </button>
            ) : null}
          </div>
        ) : (
          <form action={mode === "live" ? formAction : undefined}>
            {mode === "live" ? (
              <input type="hidden" name="initiative" value={slug} />
            ) : null}
            <button
              type={mode === "live" ? "submit" : "button"}
              onClick={mode === "demo" ? sign : undefined}
              disabled={mode === "live" && pending}
              className={buttonClasses("primary", "md", "w-full sm:w-auto")}
            >
              {mode === "live" && pending
                ? "Wird gespeichert …"
                : "Jetzt unterschreiben"}
            </button>
          </form>
        )}
      </div>

      {mode === "live" && state.status === "error" ? (
        <p className="mt-3 text-xs leading-relaxed text-danger" role="alert">
          {state.message}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-faint">
        {mode === "live"
          ? "Die Unterschrift wird serverseitig gespeichert. Eine Unterschrift pro Bürger."
          : "Demo: Die Unterschrift wird nur lokal in diesem Browser gespeichert."}
      </p>
    </div>
  );
}
