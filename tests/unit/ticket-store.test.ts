import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { ticketFilters, type TicketCreate } from "@/lib/schemas/ticket";
import { TicketError, ticketStore } from "@/lib/tickets/store";
import type { Actor } from "@/lib/tickets/workflow";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let t = 0;
const now = () => new Date(t);
const tick = () => (t += 60_000);

let qa: Actor, dev: Actor, dev2: Actor, admin: Actor;
let billing: string, meterReading: string;

const input = (over: Partial<TicketCreate> = {}): TicketCreate => ({
  type: "BUG",
  title: "Bill shows the wrong total",
  description: "Open account QA-001, the total is off.",
  areaId: null,
  severity: "S2",
  priority: "P2",
  foundIn: null,
  assigneeId: null,
  ...over,
});

const filters = (raw: Record<string, string> = {}) => ticketFilters.parse(raw);

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.ticket.deleteMany();
  await db.setting.deleteMany({ where: { key: "tickets.lastNumber" } });
  await db.areaMember.deleteMany();
  await db.erpArea.deleteMany({ where: { parentId: { not: null } } });
  await db.erpArea.deleteMany();
  await db.user.deleteMany();
  t = new Date("2026-10-29T00:00:00Z").getTime();

  const mk = async (name: string, role: "QA" | "DEV" | "ADMIN", active = true) => {
    const u = await db.user.create({ data: { name, email: `${name.toLowerCase().replace(/\W/g, "")}@x.ph`, passwordHash: "x", role, active } });
    return { id: u.id, role } as Actor;
  };
  qa = await mk("Ana QA", "QA");
  dev = await mk("Ben Dev", "DEV");
  dev2 = await mk("Cy Dev", "DEV");
  admin = await mk("Ada Admin", "ADMIN");
  billing = (await db.erpArea.create({ data: { name: "Billing" } })).id;
  meterReading = (await db.erpArea.create({ data: { name: "Meter Reading", parentId: billing } })).id;
});

describe("ticketStore", () => {
  it("numbers tickets in order and records who filed and assigned them", async () => {
    const s = ticketStore(db, now);
    const a = await s.create(qa, input({ assigneeId: dev.id, areaId: meterReading }), [
      { kind: "IMAGE", storedName: "2026/10/" + "a".repeat(32) + ".png", originalName: "shot.png", mime: "image/png", size: 10 },
    ]);
    const b = await s.create(admin, input({ type: "SUGGESTION", severity: null }));
    expect([a.number, b.number]).toEqual([1, 2]);

    const detail = (await s.get(1, admin))!;
    expect(detail.reporter.name).toBe("Ana QA");
    expect(detail.assignee?.name).toBe("Ben Dev");
    expect(detail.area?.parent?.name).toBe("Billing");
    expect(detail.attachments).toHaveLength(1);
    expect(detail.events.map((e) => [e.kind, e.to])).toEqual([
      ["CREATED", null],
      ["ASSIGNEE", "Ben Dev"],
    ]);
  });

  it("refuses bad assignees, and developers filing tickets", async () => {
    const s = ticketStore(db, now);
    await expect(s.create(qa, input({ assigneeId: qa.id }))).rejects.toThrow(/active developer or admin/);
    await expect(s.create(dev, input())).rejects.toThrow(/can't file tickets/);
    const gone = await db.user.create({ data: { name: "Old Dev", email: "old@x.ph", passwordHash: "x", role: "DEV", active: false } });
    await expect(s.create(qa, input({ assigneeId: gone.id }))).rejects.toThrow(TicketError);
  });

  it("runs the full loop and keeps the timeline", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    tick();
    await s.transition(dev, id, { to: "IN_PROGRESS", note: null, duplicateOf: null });
    tick();
    await s.transition(dev, id, { to: "NEED_INFO", note: "Which billing month?", duplicateOf: null });
    tick();
    await s.comment(qa, id, "October 2026.");
    tick();
    await s.transition(qa, id, { to: "IN_PROGRESS", note: null, duplicateOf: null });
    tick();
    await s.transition(dev, id, { to: "FIXED", note: "Rounding fixed in build 1.4.2", duplicateOf: null });
    tick();
    await s.transition(qa, id, { to: "VERIFIED", note: null, duplicateOf: null });
    tick();
    await s.transition(qa, id, { to: "CLOSED", note: null, duplicateOf: null });

    const d = (await s.get(1, admin))!;
    expect(d.status).toBe("CLOSED");
    expect(d.closedAt?.getTime()).toBe(t);
    expect(d.lastActivityAt.getTime()).toBe(t);
    expect(d.comments.map((c) => c.body)).toEqual(["October 2026."]);
    expect(d.events.filter((e) => e.kind === "STATUS").map((e) => `${e.from}→${e.to}`)).toEqual([
      "NEW→IN_PROGRESS",
      "IN_PROGRESS→NEED_INFO",
      "NEED_INFO→IN_PROGRESS",
      "IN_PROGRESS→FIXED",
      "FIXED→VERIFIED",
      "VERIFIED→CLOSED",
    ]);
    expect(d.events.find((e) => e.to === "NEED_INFO")?.note).toBe("Which billing month?");

    tick();
    await s.transition(qa, id, { to: "REOPENED", note: "Still wrong for senior citizens", duplicateOf: null });
    expect((await s.get(1, admin))!.closedAt).toBeNull();
  });

  it("refuses moves the workflow forbids and needs notes", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    // Another developer can't even see it; the assigned one can't skip the rules.
    await expect(s.transition(dev2, id, { to: "FIXED", note: null, duplicateOf: null })).rejects.toThrow(/no longer exists/);
    await expect(s.transition(dev, id, { to: "VERIFIED", note: null, duplicateOf: null })).rejects.toThrow(/can't move/);
    await expect(s.transition(qa, id, { to: "FIXED", note: null, duplicateOf: null })).rejects.toThrow(TicketError);
    await expect(s.transition(dev, id, { to: "REJECTED", note: null, duplicateOf: null })).rejects.toThrow(/note/);
  });

  it("marks duplicates against an existing other ticket", async () => {
    const s = ticketStore(db, now);
    await s.create(qa, input());
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    await expect(s.transition(dev, id, { to: "DUPLICATE", note: null, duplicateOf: 99 })).rejects.toThrow(/no ticket #99/);
    await expect(s.transition(dev, id, { to: "DUPLICATE", note: null, duplicateOf: 2 })).rejects.toThrow(/itself/);
    await s.transition(dev, id, { to: "DUPLICATE", note: null, duplicateOf: 1 });
    const d = (await s.get(2, admin))!;
    expect(d.duplicateOf?.number).toBe(1);
    expect(d.events.at(-1)?.note).toBe("Duplicate of #1.");
  });

  it("refuses a move when the status changed underneath", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    await db.ticket.update({ where: { id }, data: { status: "FIXED" } });
    // The dev's page still thinks it is NEW, but the store reloads, so the move is checked against FIXED.
    await expect(s.transition(dev, id, { to: "IN_PROGRESS", note: null, duplicateOf: null })).rejects.toThrow(/can't move/);
  });

  it("edits only as the reporter or an admin, with one event per changed field", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    const edit = { type: "BUG" as const, title: "Bill total is wrong for seniors", description: "New text", areaId: billing, severity: "S1" as const, priority: "P2" as const, foundIn: null };
    // The assigned developer sees the ticket but can't edit it.
    await expect(s.update(dev, id, edit)).rejects.toThrow(/Only the person who filed/);
    expect(await s.update(qa, id, edit)).toBe(4);
    const fields = (await s.get(1, admin))!.events.filter((e) => e.kind === "FIELD");
    expect(fields.map((e) => [e.field, e.from, e.to])).toEqual([
      ["title", "Bill shows the wrong total", "Bill total is wrong for seniors"],
      ["description", null, null],
      ["module", null, "Billing"],
      ["severity", "S2 Major", "S1 Critical"],
    ]);
    expect(await s.update(admin, id, edit)).toBe(0);
  });

  it("reassigns with names in the timeline", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    await expect(s.assign(dev, id, dev2.id)).rejects.toThrow(/Only QA testers and admins/);
    await s.assign(qa, id, dev2.id);
    await s.assign(qa, id, dev2.id); // no-op
    await s.assign(admin, id, null);
    const evs = (await s.get(1, admin))!.events.filter((e) => e.kind === "ASSIGNEE");
    expect(evs.map((e) => [e.from, e.to])).toEqual([
      [null, "Ben Dev"],
      ["Ben Dev", "Cy Dev"],
      ["Cy Dev", null],
    ]);
  });

  it("needs text or an image for a comment", async () => {
    const s = ticketStore(db, now);
    const { id } = await s.create(qa, input({ assigneeId: dev.id }));
    await expect(s.comment(dev, id, "   ")).rejects.toThrow(/Write a message/);
    await s.comment(dev, id, "", [{ kind: "IMAGE", storedName: "2026/10/" + "b".repeat(32) + ".png", originalName: "x.png", mime: "image/png", size: 5 }]);
    const d = (await s.get(1, admin))!;
    expect(d.comments[0].attachments).toHaveLength(1);
    expect(d.attachments).toHaveLength(0);
  });

  it("filters the list by group, status, module, people and search", async () => {
    const s = ticketStore(db, now);
    const one = await s.create(qa, input({ title: "Payroll tax off by one", areaId: billing, assigneeId: dev.id }));
    tick();
    await s.create(qa, input({ title: "Meter reading screen slow", areaId: meterReading, assigneeId: dev2.id }));
    tick();
    const three = await s.create(admin, input({ title: "Export button misaligned", type: "IMPROVEMENT", severity: null }));
    tick();
    await s.transition(dev, one.id, { to: "FIXED", note: null, duplicateOf: null });
    await s.transition(admin, three.id, { to: "CLOSED", note: "Filed by mistake", duplicateOf: null });

    const titles = async (raw: Record<string, string>, who: Actor = admin) => (await s.list(filters(raw), who)).rows.map((r) => r.number);
    expect(await titles({})).toEqual([1, 2]); // open, newest activity first
    expect(await titles({ group: "done" })).toEqual([3]);
    expect(await titles({ group: "all" })).toEqual([1, 3, 2]);
    expect(await titles({ status: "FIXED", reporter: "me" }, qa)).toEqual([1]);
    expect(await titles({ area: billing })).toEqual([1, 2]); // includes sub-modules
    expect(await titles({ area: meterReading })).toEqual([2]);
    expect(await titles({ assignee: "me" }, admin)).toEqual([]);
    expect(await titles({ group: "all", assignee: "none" })).toEqual([3]);
    expect(await titles({ group: "all", type: "IMPROVEMENT" })).toEqual([3]);
    expect(await titles({ q: "meter" })).toEqual([2]);
    expect(await titles({ group: "all", q: "#3" })).toEqual([3]);
    expect((await s.list(filters({ group: "all" }), admin)).total).toBe(3);
  });

  it("shows QA testers only their own tickets and developers only their assignments", async () => {
    const s = ticketStore(db, now);
    const qa2: Actor = { id: (await db.user.create({ data: { name: "Bea QA", email: "bea@x.ph", passwordHash: "x", role: "QA" } })).id, role: "QA" };
    const mine = await s.create(qa, input({ title: "Ana's bug", assigneeId: dev.id }));
    const theirs = await s.create(qa2, input({ title: "Bea's bug", assigneeId: dev2.id }));
    await s.create(admin, input({ title: "Unassigned" }));

    const list = async (who: Actor, raw: Record<string, string> = { group: "all" }) => (await s.list(filters(raw), who)).rows.map((r) => r.title);
    expect(await list(qa)).toEqual(["Ana's bug"]);
    expect(await list(qa2)).toEqual(["Bea's bug"]);
    expect(await list(dev)).toEqual(["Ana's bug"]);
    expect(await list(dev2)).toEqual(["Bea's bug"]);
    expect(await list(admin)).toHaveLength(3);
    // A filter can narrow the scope but never widen it.
    expect(await list(qa, { group: "all", reporter: qa2.id })).toEqual([]);
    expect(await list(dev, { group: "all", assignee: dev2.id })).toEqual([]);

    expect(await s.get(2, qa)).toBeNull();
    expect((await s.get(1, qa))?.title).toBe("Ana's bug");
    expect(await s.get(2, dev)).toBeNull();
    await expect(s.comment(qa, theirs.id, "Hi")).rejects.toThrow(/no longer exists/);
    await expect(s.transition(dev, theirs.id, { to: "FIXED", note: null, duplicateOf: null })).rejects.toThrow(/no longer exists/);

    // Reassigning takes the ticket off the old developer's list.
    await s.assign(qa, mine.id, dev2.id);
    expect(await list(dev)).toEqual([]);
    expect(await list(dev2)).toEqual(["Ana's bug", "Bea's bug"]);

    expect(await s.counts(qa)).toMatchObject({ open: 1, toStart: 1, fixed: 0 });
    expect((await s.recent(dev2)).map((r) => r.title)).toEqual(["Ana's bug", "Bea's bug"]);
  });

  it("only gives out attachments on tickets the person can see", async () => {
    const s = ticketStore(db, now);
    const file = { kind: "IMAGE" as const, storedName: "2026/10/" + "c".repeat(32) + ".png", originalName: "x.png", mime: "image/png", size: 5 };
    await s.create(qa, input({ assigneeId: dev.id }), [file]);
    const att = await db.attachment.findFirstOrThrow();
    expect(await s.attachmentFor(qa, att.id)).toMatchObject({ storedName: file.storedName });
    expect(await s.attachmentFor(dev, att.id)).not.toBeNull();
    expect(await s.attachmentFor(dev2, att.id)).toBeNull();
    expect(await s.attachmentFor(admin, att.id)).not.toBeNull();
  });

  it("deletes permanently only for the filing QA tester or an admin, after the exact title is typed", async () => {
    const s = ticketStore(db, now);
    const file = { kind: "IMAGE" as const, storedName: "2026/10/" + "d".repeat(32) + ".png", originalName: "x.png", mime: "image/png", size: 5 };
    const { id } = await s.create(qa, input({ title: "Bill shows the wrong total", assigneeId: dev.id }), [file]);
    await s.comment(dev, id, "Looking", [{ ...file, storedName: "2026/10/" + "e".repeat(32) + ".png" }]);
    const other = await s.create(qa, input({ title: "Another one" }));
    await s.transition(qa, other.id, { to: "DUPLICATE", note: null, duplicateOf: 1 });

    await expect(s.delete(dev, id, "Bill shows the wrong total")).rejects.toThrow(/Only the QA tester who filed/);
    await expect(s.delete(qa, id, "bill shows the wrong total")).rejects.toThrow(/doesn't match/);
    await expect(s.delete(qa, id, "")).rejects.toThrow(/doesn't match/);

    const r = await s.delete(qa, id, "  Bill shows the wrong total ");
    expect(r.number).toBe(1);
    expect(r.files.map((f) => f.storedName).sort()).toEqual(["2026/10/" + "d".repeat(32) + ".png", "2026/10/" + "e".repeat(32) + ".png"]);
    expect(await db.ticket.count({ where: { id } })).toBe(0);
    expect(await db.ticketComment.count({ where: { ticketId: id } })).toBe(0);
    expect(await db.ticketEvent.count({ where: { ticketId: id } })).toBe(0);
    expect(await db.attachment.count({ where: { ticketId: id } })).toBe(0);
    // The ticket that pointed at it as a duplicate stays, without the link.
    expect((await db.ticket.findUniqueOrThrow({ where: { id: other.id } })).duplicateOfId).toBeNull();

    // Numbers are never reused: deleting the newest (#2) and filing again gives #3.
    await s.delete(qa, other.id, "Another one");
    expect((await s.create(qa, input())).number).toBe(3);
  });

  it("attaches a pending video only for the person who uploaded it, once", async () => {
    const s = ticketStore(db, now);
    const vid = (c: string) => ({ kind: "VIDEO" as const, storedName: `2026/10/${c.repeat(32)}.mp4`, originalName: "repro.mp4", mime: "video/mp4", size: 5_000_000, durationSec: 42 });
    const mine = await s.pending.create(qa, vid("a"));
    const devs = await s.pending.create(dev, vid("b"));

    // Someone else's upload is refused, and nothing is filed.
    await expect(s.create(qa, input(), [], [devs])).rejects.toThrow(TicketError);
    expect(await db.ticket.count()).toBe(0);

    const tk = await s.create(qa, input(), [], [mine]);
    const detail = (await s.get(tk.number, qa))!;
    expect(detail.attachments.map((a) => [a.kind, a.originalName, a.durationSec])).toEqual([["VIDEO", "repro.mp4", 42]]);
    expect(await db.pendingUpload.count({ where: { id: mine } })).toBe(0);
    // Already claimed: can't be attached twice.
    await expect(s.comment(qa, tk.id, "again", [], [mine])).rejects.toThrow(/expired/);

    // A reply can be just a video.
    await s.assign(qa, tk.id, dev.id);
    await s.comment(dev, tk.id, "", [], [devs]);
    const after = (await s.get(tk.number, dev))!;
    expect(after.comments[0].attachments.map((a) => a.kind)).toEqual(["VIDEO"]);
    expect(await s.attachmentFor(dev, after.comments[0].attachments[0].id)).toMatchObject({ mime: "video/mp4" });
  });

  it("removes your own pending video and sweeps old ones", async () => {
    const s = ticketStore(db, now);
    const vid = (c: string) => ({ kind: "VIDEO" as const, storedName: `2026/10/${c.repeat(32)}.webm`, originalName: "r.webm", mime: "video/webm", size: 10 });
    const a = await s.pending.create(qa, vid("c"));
    expect(await s.pending.remove(dev, a)).toBeNull();
    expect(await s.pending.remove(qa, a)).toEqual({ storedName: vid("c").storedName });

    await s.pending.create(qa, vid("d"));
    t += 23 * 3_600_000;
    await s.pending.create(qa, vid("e"));
    expect(await s.pending.sweep()).toEqual([]);
    t += 2 * 3_600_000;
    expect(await s.pending.sweep()).toEqual([{ storedName: vid("d").storedName }]);
    expect(await db.pendingUpload.count()).toBe(1);
  });
});
