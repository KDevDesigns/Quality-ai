import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { UserDeleteError, userDeletion } from "@/lib/users/delete";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

type U = { id: string };
let admin: U, qa: U, dev: U, other: U;
let qaTicket: string, otherTicket: string, assignedTicket: string;

const user = (name: string, role: "ADMIN" | "QA" | "DEV") =>
  db.user.create({ data: { name, email: `${name.toLowerCase()}@davao-water.gov.ph`, passwordHash: "x", role }, select: { id: true } });
const file = (ticketId: string, uploaderId: string, n: string, commentId?: string) =>
  db.attachment.create({ data: { ticketId, commentId, uploaderId, kind: "IMAGE", storedName: `2026/10/${n}.png`, originalName: "x.png", mime: "image/png", size: 1000 } });

beforeEach(async () => {
  await db.ticket.deleteMany();
  await db.pendingUpload.deleteMany();
  await db.user.deleteMany();
  admin = await user("Boss", "ADMIN");
  qa = await user("Ana", "QA");
  dev = await user("Ben", "DEV");
  other = await user("Cara", "QA");

  // Ana's ticket, with a reply from Ben and a file from each.
  qaTicket = (await db.ticket.create({ data: { number: 1, type: "BUG", title: "Ana's bug", description: "…", reporterId: qa.id, assigneeId: dev.id } })).id;
  const benReply = await db.ticketComment.create({ data: { ticketId: qaTicket, authorId: dev.id, body: "On it" } });
  await file(qaTicket, qa.id, "a1");
  await file(qaTicket, dev.id, "b1", benReply.id);
  await db.ticketEvent.create({ data: { ticketId: qaTicket, actorId: dev.id, kind: "STATUS", from: "NEW", to: "IN_PROGRESS" } });

  // Cara's ticket, where Ana replied with a file and changed the status.
  otherTicket = (await db.ticket.create({ data: { number: 2, type: "BUG", title: "Cara's bug", description: "…", reporterId: other.id } })).id;
  const anaReply = await db.ticketComment.create({ data: { ticketId: otherTicket, authorId: qa.id, body: "Same here" } });
  await file(otherTicket, qa.id, "a2", anaReply.id);
  await db.ticketEvent.create({ data: { ticketId: otherTicket, actorId: qa.id, kind: "STATUS", from: "NEW", to: "VERIFIED" } });
  await db.ticketComment.create({ data: { ticketId: otherTicket, authorId: other.id, body: "Thanks" } });

  // A ticket assigned to Ana that someone else filed.
  assignedTicket = (await db.ticket.create({ data: { number: 3, type: "BUG", title: "For Ana", description: "…", reporterId: other.id, assigneeId: qa.id, lastActivityById: qa.id } })).id;

  await db.pendingUpload.create({ data: { uploaderId: qa.id, kind: "IMAGE", status: "READY", storedName: "2026/10/a3.png", originalName: "y.png", mime: "image/png", size: 500 } });
});

describe("deleting a user and everything they made", () => {
  it("previews what goes", async () => {
    expect(await userDeletion(db).preview(qa.id)).toEqual({
      name: "Ana",
      email: "ana@davao-water.gov.ph",
      tickets: 1,
      othersReplies: 1,
      replies: 1,
      files: 4, // a1 and b1 on her ticket, a2 on Cara's, a3 not yet sent
      bytes: 3500,
    });
    expect(await userDeletion(db).preview("nobody")).toBeNull();
  });

  it("deletes their tickets with everything on them, and what they left elsewhere", async () => {
    const { files } = await userDeletion(db).deleteEverything(admin, qa.id, " ANA@davao-water.gov.ph ");
    expect(files.sort()).toEqual(["2026/10/a1.png", "2026/10/a2.png", "2026/10/a3.png", "2026/10/b1.png"]);

    expect(await db.user.findUnique({ where: { id: qa.id } })).toBeNull();
    // Her ticket is gone, including Ben's reply, file and timeline entry on it.
    expect(await db.ticket.findUnique({ where: { id: qaTicket } })).toBeNull();
    expect(await db.ticketComment.count({ where: { authorId: dev.id } })).toBe(0);
    // Cara's ticket stays, without Ana's reply, file or status change.
    const kept = await db.ticket.findUniqueOrThrow({ where: { id: otherTicket }, select: { comments: { select: { body: true } }, attachments: true, events: true } });
    expect(kept.comments).toEqual([{ body: "Thanks" }]);
    expect(kept.attachments).toEqual([]);
    expect(kept.events).toEqual([]);
    // The ticket assigned to her stays, unassigned.
    expect(await db.ticket.findUniqueOrThrow({ where: { id: assignedTicket }, select: { assigneeId: true, lastActivityById: true } })).toEqual({ assigneeId: null, lastActivityById: null });
    expect(await db.pendingUpload.count()).toBe(0);
  });

  it("refuses the wrong email, yourself and the last admin, and changes nothing", async () => {
    const d = userDeletion(db);
    await expect(d.deleteEverything(admin, qa.id, "ana@yahoo.com")).rejects.toThrow(UserDeleteError);
    await expect(d.deleteEverything(admin, admin.id, "boss@davao-water.gov.ph")).rejects.toThrow(/your own/);
    await expect(d.deleteEverything(qa, admin.id, "boss@davao-water.gov.ph")).rejects.toThrow(/at least one active admin/);
    await expect(d.deleteEverything(admin, "nobody", "x")).rejects.toThrow(/doesn't exist/);
    expect(await db.user.count()).toBe(4);
    expect(await db.ticket.count()).toBe(3);
  });

  it("lets an admin delete another admin while one stays", async () => {
    const second = await user("Dina", "ADMIN");
    await userDeletion(db).deleteEverything(admin, second.id, "dina@davao-water.gov.ph");
    expect(await db.user.count({ where: { role: "ADMIN" } })).toBe(1);
  });
});
