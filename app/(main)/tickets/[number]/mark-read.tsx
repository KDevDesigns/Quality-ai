"use client";

import { useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import { markTicketRead } from "../actions";

/** Closes this ticket's device notification, so its "3 new replies" count starts again from what's unread. */
function closeDeviceNotification(number: number) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistration("/")
    .then((reg) => reg?.getNotifications({ tag: `ticket-${number}` }))
    .then((shown) => shown?.forEach((n) => n.close()), () => {});
}

/**
 * Marks the ticket read once this page has shown its latest activity, and again whenever a refresh brings newer
 * activity in. Then the bell and the sidebar count update at once, without waiting for the next poll.
 */
export function MarkRead({ ticketId, number, lastActivityAt }: { ticketId: string; number: number; lastActivityAt: string }) {
  const { poll } = useNotifications();
  useEffect(() => {
    let live = true;
    closeDeviceNotification(number);
    markTicketRead(ticketId).then(() => live && poll(), () => {});
    return () => {
      live = false;
    };
  }, [ticketId, number, lastActivityAt, poll]);
  return null;
}
