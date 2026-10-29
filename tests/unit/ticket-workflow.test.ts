import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  canAssign,
  canDeleteTicket,
  canEditTicket,
  canSeeTicket,
  isDone,
  OPEN_STATUSES,
  TICKET_STATUSES,
  ticketScope,
  transitionError,
  type Actor,
  type TicketRef,
  type TicketStatus,
} from "@/lib/tickets/workflow";

const qa: Actor = { id: "qa1", role: "QA" };
const otherQa: Actor = { id: "qa2", role: "QA" };
const dev: Actor = { id: "dev1", role: "DEV" };
const otherDev: Actor = { id: "dev2", role: "DEV" };
const admin: Actor = { id: "adm", role: "ADMIN" };

const ticket = (status: TicketStatus, assigneeId: string | null = "dev1"): TicketRef => ({ status, reporterId: "qa1", assigneeId });
const moves = (t: TicketRef, u: Actor) => allowedTransitions(t, u).map((m) => m.to);

describe("ticket workflow", () => {
  it("lets the assigned developer work a new ticket", () => {
    expect(moves(ticket("NEW"), dev)).toEqual(["IN_PROGRESS", "FIXED", "NEED_INFO", "DUPLICATE", "WONT_FIX", "REJECTED"]);
    expect(moves(ticket("IN_PROGRESS"), dev)).toEqual(["FIXED", "NEED_INFO", "DUPLICATE", "WONT_FIX", "REJECTED"]);
    expect(moves(ticket("REOPENED"), dev)).toContain("IN_PROGRESS");
  });

  it("gives other developers no moves on someone else's ticket", () => {
    expect(moves(ticket("NEW"), otherDev)).toEqual([]);
    expect(moves(ticket("NEW", null), dev)).toEqual([]);
  });

  it("lets the QA tester who filed it verify, close and reopen, but not fix", () => {
    expect(moves(ticket("FIXED"), qa)).toEqual(["VERIFIED", "REOPENED"]);
    expect(moves(ticket("VERIFIED"), qa)).toEqual(["CLOSED", "REOPENED"]);
    for (const s of ["CLOSED", "REJECTED", "DUPLICATE", "WONT_FIX"] as const) expect(moves(ticket(s), qa)).toEqual(["REOPENED"]);
    expect(moves(ticket("IN_PROGRESS"), qa)).toEqual(["DUPLICATE"]);
  });

  it("gives other QA testers no moves (they can't see the ticket)", () => {
    expect(moves(ticket("FIXED"), otherQa)).toEqual([]);
    expect(moves(ticket("NEED_INFO"), otherQa)).toEqual([]);
  });

  it("never lets a developer verify, close or reopen", () => {
    expect(moves(ticket("FIXED"), dev)).toEqual([]);
    expect(moves(ticket("VERIFIED"), dev)).toEqual([]);
    expect(moves(ticket("CLOSED"), dev)).toEqual([]);
  });

  it("lets the reporter or the developer resume a ticket waiting for info", () => {
    expect(moves(ticket("NEED_INFO"), qa)).toEqual(["IN_PROGRESS", "DUPLICATE", "CLOSED"]);
    expect(moves(ticket("NEED_INFO"), dev)).toContain("IN_PROGRESS");
  });

  it("lets the reporter withdraw a new ticket", () => {
    expect(moves(ticket("NEW"), qa)).toEqual(["DUPLICATE", "CLOSED"]);
    expect(allowedTransitions(ticket("NEW"), qa).find((m) => m.to === "CLOSED")?.label).toBe("Withdraw");
  });

  it("lets an admin do both sides", () => {
    expect(moves(ticket("NEW", "dev1"), admin)).toEqual(expect.arrayContaining(["IN_PROGRESS", "FIXED", "CLOSED"]));
    expect(moves(ticket("FIXED"), admin)).toEqual(["VERIFIED", "REOPENED"]);
  });

  it("returns each target status once", () => {
    for (const s of TICKET_STATUSES) {
      const list = moves(ticket(s), admin);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("requires notes and a duplicate number where the rules say so", () => {
    expect(transitionError(ticket("IN_PROGRESS"), dev, { to: "NEED_INFO" })).toBe("Add a note explaining why.");
    expect(transitionError(ticket("IN_PROGRESS"), dev, { to: "NEED_INFO", note: "  " })).toBe("Add a note explaining why.");
    expect(transitionError(ticket("IN_PROGRESS"), dev, { to: "NEED_INFO", note: "Which account?" })).toBeNull();
    expect(transitionError(ticket("FIXED"), qa, { to: "REOPENED" })).toBe("Add a note explaining why.");
    expect(transitionError(ticket("NEW"), dev, { to: "REJECTED" })).toBe("Add a note explaining why.");
    expect(transitionError(ticket("NEW"), dev, { to: "DUPLICATE" })).toMatch(/number of the ticket/);
    expect(transitionError(ticket("NEW"), dev, { to: "DUPLICATE", duplicateOf: 3 })).toBeNull();
    expect(transitionError(ticket("IN_PROGRESS"), dev, { to: "FIXED" })).toBeNull();
  });

  it("refuses moves that aren't allowed", () => {
    expect(transitionError(ticket("NEW"), qa, { to: "FIXED" })).toMatch(/can't move this ticket from New to Fixed/);
    expect(transitionError(ticket("CLOSED"), admin, { to: "FIXED" })).toMatch(/can't move/);
  });

  it("groups statuses and gates editing and assigning", () => {
    expect(isDone("CLOSED")).toBe(true);
    expect(isDone("FIXED")).toBe(false);
    expect(OPEN_STATUSES).not.toContain("WONT_FIX");
    expect(canEditTicket(ticket("NEW"), qa)).toBe(true);
    expect(canEditTicket(ticket("NEW"), otherQa)).toBe(false);
    expect(canEditTicket(ticket("NEW"), admin)).toBe(true);
    expect(canAssign(qa)).toBe(true);
    expect(canAssign(dev)).toBe(false);
  });

  it("scopes tickets: QA their own, developers their assignments, admins everything", () => {
    expect(ticketScope(qa)).toEqual({ reporterId: "qa1" });
    expect(ticketScope(dev)).toEqual({ assigneeId: "dev1" });
    expect(ticketScope(admin)).toBe("all");
    expect(canSeeTicket(ticket("NEW"), qa)).toBe(true);
    expect(canSeeTicket(ticket("NEW"), otherQa)).toBe(false);
    expect(canSeeTicket(ticket("NEW"), dev)).toBe(true);
    expect(canSeeTicket(ticket("NEW"), otherDev)).toBe(false);
    expect(canSeeTicket(ticket("NEW", null), dev)).toBe(false);
    expect(canSeeTicket(ticket("NEW", null), admin)).toBe(true);
  });

  it("lets only the filing QA tester or an admin edit and delete, never a developer", () => {
    const filedByDev: TicketRef = { status: "NEW", reporterId: "dev1", assigneeId: "dev1" };
    expect(canDeleteTicket(ticket("NEW"), qa)).toBe(true);
    expect(canDeleteTicket(ticket("NEW"), otherQa)).toBe(false);
    expect(canDeleteTicket(ticket("NEW"), dev)).toBe(false);
    expect(canDeleteTicket(ticket("CLOSED"), admin)).toBe(true);
    expect(canEditTicket(filedByDev, dev)).toBe(false);
    expect(canDeleteTicket(filedByDev, dev)).toBe(false);
  });
});
