"use client";

import { useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import { playTone } from "./account/device-push";

// When a device notification arrives, the service worker (public/sw.js) asks an open QA Hub tab to play the person's
// tone and waits for the answer, so it can show the notification silently instead of with the device's sound. Then it
// tells every open tab, so the bell, the counts and the page update at once instead of at the next check.

export function ToneListener() {
  const { poll } = useNotifications();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "qa-hub:refresh") return poll();
      if (e.data?.type !== "qa-hub:play-tone") return;
      const port = e.ports[0];
      // A tab behind other windows says no, so the device's own sound plays instead of nothing.
      if (document.visibilityState !== "visible") return port?.postMessage(false);
      playTone(String(e.data.tone)).then((played) => port?.postMessage(played));
    };
    sw.addEventListener("message", onMessage);
    sw.startMessages();
    return () => sw.removeEventListener("message", onMessage);
  }, [poll]);
  return null;
}
