"use client";

import { useEffect } from "react";

/**
 * Keeps a conversation scrolled to its newest message, like a chat: when it opens, and when a refresh brings in
 * something new (`version` changes). On a wide screen the messages scroll in their own pane; on a phone the page
 * itself scrolls, so it is brought down to `endId` (the reply box) instead.
 */
export function ScrollToLatest({ targetId, endId, version }: { targetId: string; endId: string; version: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
    else document.getElementById(endId)?.scrollIntoView({ block: "end" });
  }, [targetId, endId, version]);
  return null;
}
