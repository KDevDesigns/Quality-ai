"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { useSyncExternalStore } from "react";
import { ACCENT_STORAGE_KEY, DEFAULT_ACCENT, isAccent, type AccentKey } from "@/lib/theme";

/** Light, dark or follow Windows. Adds the `dark` class to <html>; the choice is remembered per browser. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="qa-hub-theme">
      {children}
    </NextThemes>
  );
}

// The accent lives on <html data-accent="…"> (set before paint by ACCENT_SCRIPT) and in localStorage.
const listeners = new Set<() => void>();

function readAccent(): AccentKey {
  const v = document.documentElement.dataset.accent;
  return isAccent(v) ? v : DEFAULT_ACCENT;
}

export function setAccent(key: AccentKey) {
  if (key === DEFAULT_ACCENT) delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = key;
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, key);
  } catch {
    // Private windows can refuse storage; the colour still applies until the page is reloaded.
  }
  listeners.forEach((l) => l());
}

export function useAccent(): AccentKey {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readAccent,
    () => DEFAULT_ACCENT,
  );
}
