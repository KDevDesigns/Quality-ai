import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { TicketCreate } from "@/lib/schemas/ticket";
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
  foundIn: null,
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
  await db.user.deleteMany();
  t = new Date("2026-10-31T00:00:00Z").getTime();
  const mk = async (name: string, role: "QA" | "DEV" | "ADMIN") => {
    const u = await db.user.create({ data: { name, email: `${name.toLowerCase().replace(/\W/g, "")}@x.ph`, passwordHash: "x", role } });
    return { id: u.id, role } as Actor;
  };
  qa = await mk("Ana QA", "QA");
  qa2 = await mk("Bea QA", "QA");
  dev = await mk("Ben Dev", "DEV");
  dev2 = await mk("Cy Dev", "DEV");
  admin = await mk("Ada Admin", "ADMIN");
});

describe("notificationStore", () => {
  it("never notifies you about your own actions", async () => {
    const tickets = ticketStore(db, now);
    const n = notificationStore(db, now);
    const { id } = await tickets.create(qa, input({ assigneeId: dev.id }));
    tick();
    await tickets.comment(qa, id, "More detail");

    expect((await n.unread(qa)).count).toBe(0);
    // The developer it was assigned to, and the admin, see it as new.
    expect((await n.unread(dev)).count).toBe(1);
    const forAdmin = await n.unread(admin);
    expect(forAdmin.items[0]).toMatchObject({ title: "Bill shows the wrong total", actorName: "Ana QA" });
  });

  it("shows someone else's reply until the ticket is opened again", async () => {
    const tickets = ticketStore(db, now);
    const n = notificationStore(db, now);
    const { id } = await tickets.create(qa, input({ assigneeId: dev.id }));
    tick();
    await tickets.transition(dev, id, { to: "IN_PROGRESS", note: null, duplicateOf: null });
    tick();
    await tickets.comment(dev, id, "Looking at it");
    expect((await n.unread(qa)).items.map((i) => i.actorName)).toEqual(["Ben Dev"]);

    tick();
    await n.markRead(qa, id);
    expect((await n.unread(qa)).count).toBe(0);

    tick();
    await tickets.comment(dev, id, "Fixed on dev");
    expect((await n.unread(qa)).count).toBe(1);
    expect(await n.unreadIds(qa, [id])).toEqual(new Set([id]));
  });

  it("follows who can see the ticket", async () => {
    const tickets = ticketStore(db, now);
    const n = notificationStore(db, now);
    const { id } = await tickets.create(qa, input({ assigneeId: dev.id }));

    expect((await n.unread(dev2)).count).toBe(0);
    expect((await n.unread(qa2)).count).toBe(0);
    // Opening a ticket you can't see does nothing.
    await n.markRead(dev2, id);
    expect(await db.ticketRead.count()).toBe(0);

    tick();
    await tickets.assign(qa, id, dev2.id);
    expect((await n.unread(dev2)).count).toBe(1);
    // No longer assigned to Ben, so it leaves his list.
    expect((await n.unread(dev)).count).toBe(0);
  });

  it("marks everything read at once", async () => {
    const tickets = ticketStore(db, now);
    const n = notificationStore(db, now);
    await tickets.create(qa, input());
    await tickets.create(qa2, input({ title: "Second" }));
    expect((await n.unread(admin)).count).toBe(2);
    expect((await n.unread(admin, 1)).items).toHaveLength(1);

    tick();
    await n.markAllRead(admin);
    expect((await n.unread(admin)).count).toBe(0);
    await n.markAllRead(admin);
    expect(await db.ticketRead.count()).toBe(2);
  });
});
