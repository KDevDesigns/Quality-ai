import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { TicketCreate } from "@/lib/schemas/ticket";
import { inboxStore, previewOf } from "@/lib/tickets/inbox";
import { notificationStore } from "@/lib/tickets/notifications";
import { ticketStore } from "@/lib/tickets/store";
import type { Actor } from "@/lib/tickets/workflow";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let t = 0;
const now = () => new Date(t);
const tick = () => (t += 60_000);

let qa: Actor, qa2: Actor, dev: Actor, dev2: Actor, admin: Actor;

const input = (over: Partial<TicketCreate> = {}): TicketCreate => ({
  type: "BUG",
  title: "Bill shows the wrong total",
  description: "Open account QA-001, the total is off.",
  areaId: null,
  severity: "S2",
  priority: "P2",
  foundIn: null, deviceType: null,
  assigneeId: null,
  ...over,
});

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.ticket.deleteMany();
  await db.setting.deleteMany({ where: { key: "tickets.lastNumber" } });
  await db.user.deleteMany();
  t = new Date("2026-10-31T00:00:00Z").getTime();
  const mk = async (name: string, role: "QA" | "DEV" | "ADMIN") => {
    const u = await db.user.create({ data: { name, email: `${name.toLowerCase().replace(/\W/g, "")}@x.ph`, passwordHash: "x", role } });
    return { id: u.id, role } as Actor;
  };
  qa = await mk("Ana", "QA");
  qa2 = await mk("Bea", "QA");
  dev = await mk("Ben", "DEV");
  dev2 = await mk("Cy", "DEV");
  admin = await mk("Ada", "ADMIN");
});

describe("inbox threads", () => {
  it("lists the person's conversations, newest activity first, with a preview of the last thing said or done", async () => {
    const tickets = ticketStore(db, now);
    const inbox = inboxStore(db);
    const a = await tickets.create(qa, input({ title: "First", assigneeId: dev.id }));
    tick();
    await tickets.create(qa, input({ title: "Second" }));
    tick();
    await tickets.comment(dev, a.id, "Fixed on dev,\nplease retest");

    const { threads } = await inbox.threads(qa);
    expect(threads.map((x) => x.title)).toEqual(["First", "Second"]);
    expect(threads[0]).toMatchObject({ preview: "Ben: Fixed on dev, please retest", unread: true, unreadMessages: 1 });
    expect(threads[1].preview).toBe("Ana filed it");

    // A developer only sees what is assigned to them; another tester sees none of Ana's.
    expect((await inbox.threads(dev)).threads.map((x) => x.title)).toEqual(["First"]);
    expect((await inbox.threads(qa2)).threads).toEqual([]);
    expect((await inbox.threads(dev2)).threads).toEqual([]);
  });

  it("shows an event when it is newer than the last reply", async () => {
    const tickets = ticketStore(db, now);
    const { id } = await tickets.create(qa, input({ assigneeId: dev.id }));
    tick();
    await tickets.comment(dev, id, "On it");
    tick();
    await tickets.transition(dev, id, { to: "IN_PROGRESS", note: null, duplicateOf: null });
    expect((await inboxStore(db).threads(qa)).threads[0].preview).toBe("Ben moved it to In progress");
  });

  it("filters by search and unread, and pages", async () => {
    const tickets = ticketStore(db, now);
    const inbox = inboxStore(db);
    const n = notificationStore(db, now);
    const a = await tickets.create(qa, input({ title: "Wrong total" }));
    tick();
    await tickets.create(qa, input({ title: "Meter reading" }));
    tick();
    await tickets.create(qa, input({ title: "Bill reprint" }));

    expect((await inbox.threads(admin, { q: "TOTAL" })).threads.map((x) => x.title)).toEqual(["Wrong total"]);
    expect((await inbox.threads(admin, { q: "#1" })).threads.map((x) => x.number)).toEqual([1]);

    tick();
    await n.markRead(admin, a.id);
    expect((await inbox.threads(admin, { unreadOnly: true })).threads).toHaveLength(2);
    // The number beside Unread matches what that view lists.
    expect(await inbox.unreadCount(admin)).toBe(2);

    const page = await inbox.threads(admin, { take: 2 });
    expect(page.threads).toHaveLength(2);
    expect(page.more).toBe(true);
  });

  it("says a reply with only files sent files", () => {
    expect(previewOf({ body: "  ", createdAt: new Date(1), author: { name: "Ben" }, files: 2 }, null)).toBe("Ben: sent 2 files");
  });
});

describe("sidebar counts", () => {
  it("counts unread messages for My inbox and unopened new tickets for Tickets", async () => {
    const tickets = ticketStore(db, now);
    const n = notificationStore(db, now);
    const { id } = await tickets.create(qa, input({ assigneeId: dev.id }));

    // Ana filed it: nothing new for her. The developer and the admin have a new ticket.
    expect(await n.counts(qa)).toEqual({ messages: 0, newTickets: 0 });
    expect(await n.counts(dev)).toEqual({ messages: 0, newTickets: 1 });
    expect(await n.counts(admin)).toEqual({ messages: 0, newTickets: 1 });

    tick();
    await n.markRead(dev, id);
    tick();
    await tickets.comment(dev, id, "Which account?");
    tick();
    await tickets.comment(dev, id, "And which month?");
    // His own replies never count for him; Ana has two unread messages.
    expect(await n.counts(dev)).toEqual({ messages: 0, newTickets: 0 });
    expect(await n.counts(qa)).toEqual({ messages: 2, newTickets: 0 });

    tick();
    await n.markRead(qa, id);
    expect(await n.counts(qa)).toEqual({ messages: 0, newTickets: 0 });
    expect(await n.unreadMessages(admin, [id])).toEqual(new Map([[id, 2]]));
  });
});
