"use client";

import { useEffect } from "react";
import "@/hooks/use-install-prompt";

/**
 * Registers the service worker on every signed-in page, not only when notifications are turned on: sharing a file to QA Hub
 * needs it. It stores no pages or ticket data (public/sw.js).
 */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
