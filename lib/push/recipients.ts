import type { OffHoursPush } from "@/lib/schemas/push";
import { canSeeTicket, type Actor, type TicketRef } from "@/lib/tickets/workflow";

// Who gets a device notification about a ticket: everyone who can see it (the same rule as the bell), except the person
// who acted. Outside their work hours and days, each person chose: as usual, silently (it waits in the notification
// list without a sound), or not at all.

export type WorkHours = { offHoursPush: OffHoursPush; workStartMin: number; workEndMin: number; workDays: number };
export type Candidate = Actor & WorkHours;
export type Delivery = "sound" | "silent";

/** Philippine time has no daylight saving, so UTC+8 all year. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export function inWorkHours(w: Omit<WorkHours, "offHoursPush">, now: Date): boolean {
  const local = new Date(now.getTime() + MANILA_OFFSET_MS);
  if (!(w.workDays & (1 << local.getUTCDay()))) return false;
  const min = local.getUTCHours() * 60 + local.getUTCMinutes();
  // A night shift (start after end) runs past midnight.
  return w.workStartMin <= w.workEndMin ? min >= w.workStartMin && min < w.workEndMin : min >= w.workStartMin || min < w.workEndMin;
}

/** How a notification reaches this person now, or null when they asked for none at this hour. */
export function delivery(w: WorkHours, now: Date): Delivery | null {
  if (w.offHoursPush === "SOUND" || inWorkHours(w, now)) return "sound";
  return w.offHoursPush === "SILENT" ? "silent" : null;
}

export function pickRecipients<C extends Candidate>(ticket: TicketRef, actorId: string, candidates: C[], now: Date): (C & { delivery: Delivery })[] {
  return candidates.flatMap((c) => {
    const d = c.id !== actorId && canSeeTicket(ticket, c) ? delivery(c, now) : null;
    return d ? [{ ...c, delivery: d }] : [];
  });
}
