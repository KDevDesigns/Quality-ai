"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { draftKey, FILING_KEY, isOwnFiling } from "@/lib/tickets/draft";

/**
 * Where filing a ticket lands. The first landing in the tab that sent it (?filing=) is the one sure sign it was filed, so
 * the draft is deleted here, once. Opening the ticket from a list later has no such mark.
 */
export function DraftCleanup({ userId }: { userId: string }) {
  const mark = useSearchParams().get("filing");

  useEffect(() => {
    try {
      if (!isOwnFiling(mark, sessionStorage.getItem(FILING_KEY))) return;
      sessionStorage.removeItem(FILING_KEY);
      localStorage.removeItem(draftKey(userId));
    } catch {
      // Browser storage can be unavailable; the draft then just expires.
    }
  }, [mark, userId]);

  return null;
}
