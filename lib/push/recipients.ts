import { canSeeTicket, type Actor, type TicketRef } from "@/lib/tickets/workflow";

// Who gets a device notification about a ticket: everyone who can see it (the same rule as the bell), except the person
// who acted, and except people outside their work hours when they chose "Only during work hours".

export type WorkHours = { pushWorkHoursOnly: boolean; workStartMin: number; workEndMin: number; workDays: number };
export type Candidate = Actor & WorkHours;

/** Philippine time has no daylight saving, so UTC+8 all year. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export function inWorkHours(w: WorkHours, now: Date): boolean {
  if (!w.pushWorkHoursOnly) return true;
  const local = new Date(now.getTime() + MANILA_OFFSET_MS);
  if (!(w.workDays & (1 << local.getUTCDay()))) return false;
  const min = local.getUTCHours() * 60 + local.getUTCMinutes();
  // A night shift (start after end) runs past midnight.
  return w.workStartMin <= w.workEndMin ? min >= w.workStartMin && min < w.workEndMin : min >= w.workStartMin || min < w.workEndMin;
}

export function pickRecipients<C extends Candidate>(ticket: TicketRef, actorId: string, candidates: C[], now: Date): C[] {
  return candidates.filter((c) => c.id !== actorId && canSeeTicket(ticket, c) && inWorkHours(c, now));
}
