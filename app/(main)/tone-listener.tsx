"use client";

import { useEffect } from "react";
import { playTone } from "./account/device-push";

// When a device notification arrives, the service worker (public/sw.js) asks an open QA Hub tab to play the person's
// tone and waits for the answer, so it can show the notification silently instead of with the device's sound.

export function ToneListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "qa-hub:play-tone") return;
      const port = e.ports[0];
      playTone(String(e.data.tone)).then((played) => port?.postMessage(played));
    };
    sw.addEventListener("message", onMessage);
    sw.startMessages();
    return () => sw.removeEventListener("message", onMessage);
  }, []);
  return null;
}
