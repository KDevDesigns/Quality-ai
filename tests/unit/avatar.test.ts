import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AVATAR_COLORS, avatarColors, avatarSrc, centerSquare } from "@/lib/avatar";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { avatarStore } from "@/lib/users/avatar";
import { createTestDb } from "./helpers/test-db";

/** WCAG relative luminance contrast of two "#rrggbb" colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("avatar colours", () => {
  it("every pair is its own, and its initials are readable", () => {
    expect(new Set(AVATAR_COLORS.map((c) => c.background)).size).toBe(AVATAR_COLORS.length);
    for (const c of AVATAR_COLORS) expect(contrast(c.background, c.color), `${c.background} on ${c.color}`).toBeGreaterThanOrEqual(4.5);
  });

  it("gives people with neighbouring numbers different pairs, starting again after the last", () => {
    expect(avatarColors(1)).not.toEqual(avatarColors(2));
    expect(avatarColors(1)).toEqual(AVATAR_COLORS[0]);
    expect(avatarColors(AVATAR_COLORS.length)).toEqual(AVATAR_COLORS.at(-1));
    expect(avatarColors(AVATAR_COLORS.length + 1)).toEqual(AVATAR_COLORS[0]);
  });
});

describe("avatarSrc", () => {
  it("is null without a photo, and changes with a new one", () => {
    expect(avatarSrc({ id: "u1", avatarName: null })).toBeNull();
    expect(avatarSrc({ id: "u1", avatarName: "2026/11/abc.webp" })).toBe("/files/avatar/u1?v=abc");
    expect(avatarSrc({ id: "u1", avatarName: "2026/11/def.webp" })).toBe("/files/avatar/u1?v=def");
  });
});

describe("centerSquare", () => {
  it("takes the middle of a wide or tall image", () => {
    expect(centerSquare(400, 200)).toEqual({ x: 100, y: 0, size: 200 });
    expect(centerSquare(200, 400)).toEqual({ x: 0, y: 100, size: 200 });
    expect(centerSquare(300, 300)).toEqual({ x: 0, y: 0, size: 300 });
  });
});

describe("avatarStore", () => {
  let db: PrismaClient;
  let cleanup: () => Promise<void>;
  let ana: { id: string; avatarColor: number };
  let ben: { id: string; avatarColor: number };

  const upload = (uploaderId: string, storedName: string, status: "SIGNED" | "READY" = "READY") =>
    db.pendingUpload.create({ data: { uploaderId, kind: "IMAGE", status, storedName, originalName: "profile.webp", mime: "image/webp", size: 900 } });

  beforeAll(async () => {
    ({ db, cleanup } = await createTestDb());
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await db.user.deleteMany();
    ana = await db.user.create({ data: { name: "Ana", email: "ana@x.ph", passwordHash: "x", role: "QA" } });
    ben = await db.user.create({ data: { name: "Ben", email: "ben@x.ph", passwordHash: "x", role: "DEV" } });
  });

  it("numbers accounts one after another, so their colours differ", () => {
    expect(ben.avatarColor).toBe(ana.avatarColor + 1);
    expect(avatarColors(ana.avatarColor)).not.toEqual(avatarColors(ben.avatarColor));
  });

  it("makes a checked upload the photo, out of reach of the unsent-uploads clean-up", async () => {
    const s = avatarStore(db);
    const u = await upload(ana.id, "2026/11/a.webp");
    expect(await s.set(ana.id, u.id)).toEqual({ old: null });
    expect(await db.pendingUpload.count()).toBe(0);
    expect(await db.user.findUnique({ where: { id: ana.id }, select: { avatarName: true, avatarMime: true, avatarSize: true } })).toEqual({ avatarName: "2026/11/a.webp", avatarMime: "image/webp", avatarSize: 900 });
    expect(await s.fileOf(ana.id)).toBe("2026/11/a.webp");
  });

  it("hands back the old photo's file when replacing and removing", async () => {
    const s = avatarStore(db);
    await s.set(ana.id, (await upload(ana.id, "2026/11/a.webp")).id);
    expect(await s.set(ana.id, (await upload(ana.id, "2026/11/b.webp")).id)).toEqual({ old: "2026/11/a.webp" });
    expect(await s.clear(ana.id)).toBe("2026/11/b.webp");
    expect(await s.fileOf(ana.id)).toBeNull();
    expect(await s.clear(ana.id)).toBeNull();
  });

  it("refuses someone else's upload, and one not yet checked", async () => {
    const s = avatarStore(db);
    expect(await s.set(ana.id, (await upload(ben.id, "2026/11/b.webp")).id)).toBe(false);
    expect(await s.set(ana.id, (await upload(ana.id, "2026/11/c.webp", "SIGNED")).id)).toBe(false);
    expect(await s.fileOf(ana.id)).toBeNull();
  });
});
