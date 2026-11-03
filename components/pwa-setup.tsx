"use client";

import { useEffect } from "react";
import "@/hooks/use-install-prompt";
import { dropOldSharedFiles } from "@/lib/tickets/shared-files";

/**
 * Registers the service worker on every signed-in page, not only when notifications are turned on: sharing a file to QA Hub
 * needs it. It stores no pages or ticket data (public/sw.js), only a shared file until New ticket collects it, for a day at most.
 */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    if ("caches" in window) void dropOldSharedFiles();
  }, []);
  return null;
}
