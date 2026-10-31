import type { PrismaClient } from "@/lib/generated/prisma/client";
import { pushMessage, type PushEvent, type PushMessage } from "./message";
import { pickRecipients } from "./recipients";
import { effectiveTone } from "./tones";

/**
 * Sends one push to one device. Throws on failure; a push service's refusal carries its HTTP `statusCode`.
 * The real one is in web-push.ts; tests pass a fake, so they never reach the network.
 */
export type PushSender = (sub: { endpoint: string; p256dh: string; auth: string }, payload: string, opts: { ttl: number; topic: string }) => Promise<void>;

/** A notification older than this is dropped instead of arriving the next morning. */
const TTL_SECONDS = 12 * 60 * 60;

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/**
 * Sends a message to these devices. A device the push service no longer knows (404/410: turned off in the browser,
 * site data cleared, app removed) is deleted. Logs only status codes, never the message or the address.
 */
export async function sendTo(db: PrismaClient, send: PushSender, subs: Sub[], msg: PushMessage, now = new Date()): Promise<{ sent: number; removed: number }> {
  let sent = 0;
  let removed = 0;
  // Topic: a newer push about the same ticket replaces one the device hasn't received yet.
  const opts = { ttl: TTL_SECONDS, topic: msg.tag };
  await Promise.all(
    subs.map(async (s) => {
      try {
        await send(s, JSON.stringify(msg), opts);
        sent++;
        await db.pushSubscription.update({ where: { id: s.id }, data: { lastSentAt: now } });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.deleteMany({ where: { id: s.id } });
          removed++;
        } else {
          console.error(`[push] send failed: ${code ?? "network error"}`);
        }
      }
    }),
  );
  return { sent, removed };
}

/** What an action reports: a reply names its comment, and the message and photos are looked up here. */
export type TicketTrigger = Exclude<PushEvent, { kind: "reply" }> | { kind: "reply"; commentId: string };

/**
 * Tells everyone who can see a ticket (except the person who acted) that something happened on it. Runs after the
 * action has answered, and never throws: a failed notification must not fail or slow the change itself.
 */
export async function notifyTicket(
  db: PrismaClient,
  send: PushSender | null,
  input: { ticketId: string; actorId: string; event: TicketTrigger },
  opts: { now?: Date } = {},
): Promise<{ sent: number; removed: number }> {
  if (!send) return { sent: 0, removed: 0 };
  const now = opts.now ?? new Date();
  try {
    const ticket = await db.ticket.findUnique({
      where: { id: input.ticketId },
      select: { number: true, title: true, type: true, status: true, reporterId: true, assigneeId: true, area: { select: { name: true } } },
    });
    const actor = await db.user.findUnique({ where: { id: input.actorId }, select: { name: true } });
    if (!ticket || !actor) return { sent: 0, removed: 0 };

    let event: PushEvent;
    if (input.event.kind === "reply") {
      const c = await db.ticketComment.findUnique({ where: { id: input.event.commentId }, select: { body: true, attachments: { select: { kind: true } } } });
      if (!c) return { sent: 0, removed: 0 };
      event = { kind: "reply", text: c.body, photos: c.attachments.filter((x) => x.kind === "IMAGE").length, video: c.attachments.some((x) => x.kind === "VIDEO") };
    } else {
      event = input.event;
    }

    const candidates = await db.user.findMany({
      where: {
        active: true,
        pending: false,
        pushSubscriptions: { some: {} },
        OR: [{ id: ticket.reporterId }, ...(ticket.assigneeId ? [{ id: ticket.assigneeId }] : []), { role: "ADMIN" }],
      },
      select: {
        id: true,
        role: true,
        pushWorkHoursOnly: true,
        workStartMin: true,
        workEndMin: true,
        workDays: true,
        notifyTone: true,
        pushPreviews: true,
        pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
      },
    });

    const recipients = pickRecipients(ticket, input.actorId, candidates, now);

    let sent = 0;
    let removed = 0;
    for (const u of recipients) {
      const facts = { number: ticket.number, title: ticket.title, type: ticket.type, areaName: ticket.area?.name ?? null };
      const msg = {
        ...pushMessage(event, { ...facts, actorName: actor.name, forAssignee: u.id === ticket.assigneeId, previews: u.pushPreviews }),
        tone: effectiveTone(u),
      };
      const r = await sendTo(db, send, u.pushSubscriptions, msg, now);
      sent += r.sent;
      removed += r.removed;
    }
    return { sent, removed };
  } catch (e) {
    console.error("[push] couldn't send ticket notifications:", e instanceof Error ? e.message : e);
    return { sent: 0, removed: 0 };
  }
}
