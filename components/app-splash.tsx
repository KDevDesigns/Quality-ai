"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/preloader";
import { SPLASH_KEY, SPLASH_ON as ON } from "@/lib/splash";

// The QA Hub preloader, once per browser session: on the first signed-in page after opening QA Hub or signing in.
// On a full page load SPLASH_SCRIPT (lib/splash.ts, inlined by the layout) marks <html> before the first paint, so it
// shows from the very first frame; after signing in (a client-side move) the effect below marks it instead. CSS hides
// it otherwise, so it never flashes on later visits. The sign-in page clears the mark.

const STEPS: [number, string][] = [
  [0, "Signing you in…"],
  [25, "Loading your tickets…"],
  [55, "Checking what's new…"],
  [85, "Almost there…"],
  [100, "Ready"],
];

const MIN_MS = 900;
const MAX_MS = 4000;
const FADE_MS = 450;

export function AppSplash() {
  const [phase, setPhase] = useState<"loading" | "full" | "done" | "gone">("loading");
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const html = document.documentElement;
    let seen = true;
    try {
      seen = !!sessionStorage.getItem(SPLASH_KEY);
    } catch {
      // Storage blocked: skip the preloader rather than play it on every page.
    }
    // Already seen this session: CSS keeps it hidden (no mark on <html>), so there's nothing to do.
    if (seen) {
      html.classList.remove(ON);
      return;
    }
    html.classList.add(ON);
    const started = performance.now();
    // Climbs quickly at first, then slows, never quite reaching 100 until the page is ready.
    const tick = window.setInterval(() => setProgress((p) => Math.min(92, p + (p < 50 ? 6 : p < 80 ? 3 : 1))), 120);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearInterval(tick);
      setProgress(100);
      setPhase("full");
      window.setTimeout(() => setPhase("done"), 350);
      window.setTimeout(() => {
        setPhase("gone");
        html.classList.remove(ON);
        try {
          sessionStorage.setItem(SPLASH_KEY, "1");
        } catch {
          // Storage blocked: it simply shows again next time.
        }
      }, 350 + FADE_MS);
    };
    const whenLoaded = () => window.setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started)));
    if (document.readyState === "complete") whenLoaded();
    else window.addEventListener("load", whenLoaded, { once: true });
    const cap = window.setTimeout(finish, MAX_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(cap);
      window.removeEventListener("load", whenLoaded);
    };
  }, []);

  if (phase === "gone") return null;
  const status = STEPS.reduce((s, [at, text]) => (progress >= at ? text : s), STEPS[0][1]);
  return <Preloader progress={progress} status={status} done={phase === "done"} />;
}

/** On the sign-in page: the next signed-in page plays the preloader again. */
export function ResetSplash() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(SPLASH_KEY);
    } catch {
      // Nothing to reset without storage.
    }
  }, []);
  return null;
}
