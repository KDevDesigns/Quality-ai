import { STATUS_LABELS, TYPE_LABELS, type TicketStatus } from "@/lib/tickets/workflow";

// What a device notification says. With previews on (the default) it leads with the message: the ticket's title, who
// wrote what (cut short, with 📷/🎥 when something is attached) and the module. No photo: each one would be downloaded
// from Storage by every device, and screenshots show customer data. With previews off it shows no ticket text at all, only
// "#12 · Bug / New reply from Ana / Module: Billing", for people whose lock screens others can see.
// The device adds the time itself.

/** What happened, with what's needed to describe it. Replies carry the message and what's attached. */
export type PushEvent =
  | { kind: "filed" }
  | { kind: "assigned" }
  | { kind: "reply"; text: string; photos: number; video: boolean }
  | { kind: "status"; to: TicketStatus; note?: string | null }
  | { kind: "edited" };

/**
 * `tone` is the recipient's sound choice (see tones.ts), added per person when it's sent. `stack` lets the service
 * worker merge replies on one ticket (public/sw.js).
 */
export type PushMessage = { title: string; body: string; url: string; tag: string; tone?: string; stack?: { line: string; detail: string } };

export type PushTicket = { number: number; title: string; type: keyof typeof TYPE_LABELS; areaName: string | null };

const TITLE_MAX = 80;
const LINE_MAX = 120;

/** One line, cut at `max` characters with "…". */
export function clip(s: string, max: number): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 1).trimEnd()}…` : one;
}

export function pushMessage(e: PushEvent, t: PushTicket & { actorName: string; forAssignee: boolean; previews: boolean }): PushMessage {
  const a = t.actorName;
  const detail = `Module: ${t.areaName ?? "none"}`;
  let line: string;
  if (e.kind === "reply") {
    if (!t.previews) line = `New reply from ${a}`;
    else {
      const extras = [e.photos ? (e.photos > 1 ? `📷 ${e.photos} photos` : "📷 Photo") : null, e.video ? "🎥 Video" : null].filter(Boolean).join(" ");
      line = clip([`${a}:`, e.text ? clip(e.text, LINE_MAX) : null, extras || null].filter(Boolean).join(" "), LINE_MAX + 20);
    }
  } else if (e.kind === "status") {
    line = `${a} marked it ${STATUS_LABELS[e.to]}${t.previews && e.note ? `: ${clip(e.note, LINE_MAX)}` : ""}`;
  } else if (e.kind === "edited") {
    line = `Edited by ${a}`;
  } else {
    line = t.forAssignee ? `Assigned to you by ${a}` : e.kind === "filed" ? `New ticket from ${a}` : `Assignee changed by ${a}`;
  }
  return {
    title: t.previews ? `#${t.number} · ${clip(t.title, TITLE_MAX)}` : `#${t.number} · ${TYPE_LABELS[t.type]}`,
    body: `${line}\n${detail}`,
    url: `/tickets/${t.number}`,
    // The same tag replaces an older notification about this ticket instead of piling up.
    tag: `ticket-${t.number}`,
    ...(e.kind === "reply" ? { stack: { line, detail } } : {}),
  };
}

export const TEST_MESSAGE: PushMessage = { title: "QA Hub", body: "Notifications are on for this device", url: "/account", tag: "test" };
