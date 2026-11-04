"use client";

import { useSyncExternalStore } from "react";

// Chrome and Edge offer installing through one event, and may fire it before the page has finished loading. So it's caught
// as soon as this file loads (components/pwa-setup.tsx loads it on every signed-in page) and kept until someone taps Install.

type InstallEvent = Event & { prompt(): Promise<void> };

let offer: InstallEvent | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    offer = e as InstallEvent;
    changed();
  });
  window.addEventListener("appinstalled", () => {
    offer = null;
    changed();
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** `canInstall`: the browser is offering it right now. `install` must be called straight from a click. */
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribe, () => offer !== null, () => false);
  return {
    canInstall,
    install: async () => {
      // An offer works once, whatever the person answers. The browser fires a new one if it can ask again.
      const current = offer;
      offer = null;
      changed();
      await current?.prompt();
    },
  };
}
