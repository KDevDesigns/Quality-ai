"use client";

import { useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import { markTicketRead } from "../actions";

/**
 * Marks the ticket read once this page has shown its latest activity, and again whenever a refresh brings newer
 * activity in. Then the bell and the sidebar count update at once, without waiting for the next poll.
 */
export function MarkRead({ ticketId, lastActivityAt }: { ticketId: string; lastActivityAt: string }) {
  const { poll } = useNotifications();
  useEffect(() => {
    let live = true;
    markTicketRead(ticketId).then(() => live && poll(), () => {});
    return () => {
      live = false;
    };
  }, [ticketId, lastActivityAt, poll]);
  return null;
}
