"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Liest einen Wert aus dem localStorage, ohne setState im Effect.
 * Änderungen im selben Tab werden über ein eigenes Event verteilt.
 */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );
}

export function setStoredValue(key: string, value: string | null) {
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
  emit();
}
