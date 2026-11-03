"use client";

import { useEffect } from "react";

/**
 * Keeps a conversation scrolled to its newest message, like a chat: when it opens, and when a refresh brings in
 * something new (`version` changes). On a wide screen the messages scroll in their own pane; on a phone, or a laptop too
 * short to fit the pane, the page itself scrolls too, so it is also brought down to `endId` (the reply box), when given.
 * Used by My inbox and the ticket page's conversation pane.
 */
export function ScrollToLatest({ targetId, endId, version }: { targetId: string; endId?: string; version: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
    if (endId) document.getElementById(endId)?.scrollIntoView({ block: "end" });
  }, [targetId, endId, version]);
  return null;
}
