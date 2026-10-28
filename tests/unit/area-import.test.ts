import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { areaFile, importAreas } from "@/lib/areas/import";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.areaMember.deleteMany();
  await db.user.deleteMany();
  await db.erpArea.deleteMany({ where: { parentId: { not: null } } });
  await db.erpArea.deleteMany();
});

const names = async () => (await db.erpArea.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }], select: { name: true, code: true } })).map((a) => `${a.name}|${a.code}`);

describe("data/erp-areas.json", () => {
  it("is valid and has unique codes", () => {
    const file = areaFile.parse(JSON.parse(readFileSync(path.join(process.cwd(), "data", "erp-areas.json"), "utf8")));
    const codes = file.modules.flatMap((m) => [m.code, ...m.children.map((c) => c.code)]).filter(Boolean);
    expect(new Set(codes).size).toBe(codes.length);
    expect(file.modules).toHaveLength(11);
  });
});

describe("importAreas", () => {
  const file = {
    modules: [
      { name: "Human Resource", code: "HR", moduleCode: "HR", children: [{ name: "Payroll", code: "HR-PAY" }, { name: "Leave", code: "HR-LV" }] },
      { name: "Freedom of Information", code: "FOI" },
    ],
  };

  it("creates modules and sub-modules in file order", async () => {
    const r = await importAreas(db, file);
    expect(r.created).toEqual(["Human Resource", "  Payroll", "  Leave", "Freedom of Information"]);
    const hr = await db.erpArea.findUniqueOrThrow({ where: { code: "HR" }, include: { children: { orderBy: { sortOrder: "asc" } } } });
    expect(hr.moduleCode).toBe("HR");
    expect(hr.children.map((c) => c.name)).toEqual(["Payroll", "Leave"]);
  });

  it("is idempotent", async () => {
    await importAreas(db, file);
    const before = await names();
    const r = await importAreas(db, file);
    expect(r.created).toEqual([]);
    expect(await names()).toEqual(before);
  });

  it("matches by code, so a rename keeps the members", async () => {
    const old = await db.erpArea.create({ data: { name: "HR & Payroll", code: "HR" } });
    const u = await db.user.create({ data: { name: "Dev", email: "d@x.ph", role: "DEV", passwordHash: "x" } });
    await db.areaMember.create({ data: { userId: u.id, areaId: old.id, isLead: true } });

    const r = await importAreas(db, file);
    expect(r.updated).toContain("Human Resource");
    const hr = await db.erpArea.findUniqueOrThrow({ where: { code: "HR" }, include: { members: true } });
    expect(hr.id).toBe(old.id);
    expect(hr.name).toBe("Human Resource");
    expect(hr.members).toHaveLength(1);
  });

  it("keeps areas missing from the file unless pruned, and never prunes ones with people", async () => {
    const empty = await db.erpArea.create({ data: { name: "Billing & Collection", code: "BCA" } });
    const staffed = await db.erpArea.create({ data: { name: "Finance & Accounting", code: "FIN" } });
    await db.erpArea.create({ data: { name: "Old sub", parentId: empty.id } });
    const u = await db.user.create({ data: { name: "QA", email: "q@x.ph", role: "QA", passwordHash: "x" } });
    await db.areaMember.create({ data: { userId: u.id, areaId: staffed.id } });

    const keep = await importAreas(db, file);
    expect(keep.kept.sort()).toEqual(["Billing & Collection", "Finance & Accounting", "Old sub"]);
    expect(keep.removed).toEqual([]);

    const pruned = await importAreas(db, file, { prune: true });
    expect(pruned.removed.sort()).toEqual(["Billing & Collection", "Old sub"]);
    expect(pruned.kept).toEqual(["Finance & Accounting"]);
    expect(await db.erpArea.findUnique({ where: { id: staffed.id } })).not.toBeNull();
  });

  it("rejects a malformed file without writing anything", async () => {
    await expect(importAreas(db, { modules: [{ name: "Bad", code: "has space" }] })).rejects.toThrow();
    await expect(importAreas(db, { modules: [] })).rejects.toThrow();
    expect(await db.erpArea.count()).toBe(0);
  });
});
