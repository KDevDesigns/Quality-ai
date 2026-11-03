"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { InlineAlert } from "@/components/inline-alert";
import { useTouchScreen } from "@/hooks/use-touch-screen";
import { draftKey, FILING_KEY, isOwnFiling } from "@/lib/tickets/draft";

/**
 * Where filing a ticket lands. The first landing in the tab that sent it (?filing=) is the one sure sign it was filed, so
 * the draft is deleted here, once. With files on a phone (?filed=1), it also reminds the person they're still in the
 * gallery. Opening the ticket from a list later has neither.
 */
export function FiledReminder({ userId }: { userId: string }) {
  const touch = useTouchScreen();
  const params = useSearchParams();
  const mark = params.get("filing");

  useEffect(() => {
    try {
      if (!isOwnFiling(mark, sessionStorage.getItem(FILING_KEY))) return;
      sessionStorage.removeItem(FILING_KEY);
      localStorage.removeItem(draftKey(userId));
    } catch {
      // Browser storage can be unavailable; the draft then just expires.
    }
  }, [mark, userId]);

  if (params.get("filed") !== "1" || !touch) return null;
  return <InlineAlert tone="info" role="status">Delete the screenshots and recordings from your gallery if they show customer details.</InlineAlert>;
}
