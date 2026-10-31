import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseSnapshot, restoreSnapshot, snapshotFiles, takeSnapshot, type Snapshot } from "@/lib/backup";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createTestDb } from "./helpers/test-db";

let source: PrismaClient;
let target: PrismaClient;
const cleanups: (() => Promise<void>)[] = [];

beforeAll(async () => {
  for (const which of ["source", "target"] as const) {
    const t = await createTestDb();
    cleanups.push(t.cleanup);
    if (which === "source") source = t.db;
    else target = t.db;
  }

  const db = source;
  const qa = await db.user.create({ data: { name: "Ana", email: "ana@davao-water.gov.ph", passwordHash: "x", role: "QA" } });
  const dev = await db.user.create({ data: { name: "Ben", email: "ben@davao-water.gov.ph", passwordHash: "x", role: "DEV" } });
  // Child created first, so a restore in plain table order would break the tree.
  const billing = await db.erpArea.create({ data: { name: "Billing", code: "BCA" } });
  const sub = await db.erpArea.create({ data: { name: "Meter reading", parentId: billing.id } });
  await db.erpArea.create({ data: { name: "Routes", parentId: sub.id } });
  await db.areaMember.create({ data: { userId: dev.id, areaId: billing.id, isLead: true } });
  const t1 = await db.ticket.create({ data: { number: 1, type: "BUG", title: "Wrong total", description: "…", reporterId: qa.id, areaId: sub.id, assigneeId: dev.id } });
  await db.ticket.create({ data: { number: 2, type: "BUG", title: "Same", description: "…", reporterId: qa.id, status: "DUPLICATE", duplicateOfId: t1.id } });
  const c = await db.ticketComment.create({ data: { ticketId: t1.id, authorId: dev.id, body: "Fixed" } });
  await db.ticketEvent.create({ data: { ticketId: t1.id, actorId: dev.id, kind: "STATUS", from: "NEW", to: "FIXED" } });
  await db.attachment.create({
    data: { ticketId: t1.id, commentId: c.id, uploaderId: dev.id, kind: "IMAGE", storedName: "2026/10/abc123.png", originalName: "shot.png", mime: "image/png", size: 1234 },
  });
  await db.darProfile.create({ data: { userId: qa.id, fullName: "Ana Cruz" } });
  await db.darReport.create({ data: { userId: qa.id, periodStart: "2026-10-16", periodEnd: "2026-10-31", cells: { core: [["QA - BCA"]], support: [] } } });
  await db.setting.create({ data: { key: "tickets.lastNumber", value: 2 } });
  await db.session.create({ data: { id: "hash", userId: qa.id, expiresAt: new Date(Date.now() + 3600_000) } });
});

afterAll(async () => {
  for (const c of cleanups) await c();
});

// What the backup file holds: the snapshot after a trip through JSON.
const asFile = (s: Snapshot) => parseSnapshot(JSON.parse(JSON.stringify(s)));

describe("backup and restore", () => {
  it("restores every table into an empty database, with the same ids and timestamps", async () => {
    const before = asFile(await takeSnapshot(source));
    expect(before.tables.user).toHaveLength(2);
    expect(before.tables.erpArea).toHaveLength(3);

    const counts = await restoreSnapshot(target, before);
    expect(counts.ticket).toBe(2);

    const after = asFile(await takeSnapshot(target, new Date(before.takenAt)));
    for (const t of Object.keys(before.tables) as (keyof Snapshot["tables"])[]) {
      const byId = (rows: Record<string, unknown>[]) => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      expect(byId(after.tables[t]), t).toEqual(byId(before.tables[t]));
    }
  });

  it("leaves sessions out, so everyone signs in again", async () => {
    expect(await target.session.count()).toBe(0);
    expect(Object.keys((await takeSnapshot(source)).tables)).not.toContain("session");
  });

  it("refuses a database that already has data", async () => {
    await expect(restoreSnapshot(target, asFile(await takeSnapshot(source)))).rejects.toThrow(/isn't empty/);
  });

  it("lists the Storage files that belong with the backup", async () => {
    expect(snapshotFiles(await takeSnapshot(source))).toEqual([{ storedName: "2026/10/abc123.png", mime: "image/png", size: 1234 }]);
  });

  it("rejects files that aren't a QA Hub backup", () => {
    expect(() => parseSnapshot({ hello: 1 })).toThrow(/isn't a QA Hub/);
    expect(() => parseSnapshot({ app: "qa-hub", version: 99, tables: {} })).toThrow(/version 99/);
  });
});
