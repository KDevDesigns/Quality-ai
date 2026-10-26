import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { importCatalog, seedCatalog } from "@/lib/test-design/catalog";
import { STALE_JOB_MS } from "@/lib/test-design/generate";
import { catalogStore, createGenerationJob, generationStore, loadExportCases, loadTraceInputs } from "@/lib/test-design/store";
import { createTestDb } from "./helpers/test-db";

const catalogJson = JSON.parse(readFileSync(path.join(process.cwd(), "data", "seed-catalog.json"), "utf8"));

let db: PrismaClient;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
  const billing = await db.module.create({ data: { code: "BILLING", name: "Billing & Collection" } });
  await db.businessProcess.create({ data: { moduleId: billing.id, name: "Meter-to-Cash", steps: [{ name: "Apply penalties after due date", order: 1, module: null, handoff: false }] } });
});

afterAll(async () => {
  await cleanup();
});

const draft = (title: string) => ({
  title,
  technique: "Boundary value analysis" as const,
  priority: "P1" as const,
  type: "API" as const,
  preconditions: null,
  steps: ["Do it"],
  expected: "Matches the tariff oracle",
  tags: ["@critical"],
  processStep: "Apply penalties after due date",
  openQuestions: ["Rounding?"],
});

describe("seed catalog", () => {
  it("is valid and every case has a known technique", () => {
    const c = seedCatalog.parse(catalogJson);
    expect(c.areas.length).toBeGreaterThan(15);
  });

  it("imports once and skips areas already imported", async () => {
    const first = await importCatalog(catalogJson, catalogStore(db));
    expect(first.created).toBe(catalogJson.areas.length);
    expect(first.cases).toBeGreaterThan(70);

    const second = await importCatalog(catalogJson, catalogStore(db));
    expect(second).toEqual({ created: 0, skipped: catalogJson.areas.length, cases: 0 });
    expect(await db.requirement.count({ where: { source: "seed" } })).toBe(catalogJson.areas.length);
  });

  it("links areas to modules and processes that exist, and leaves the rest unlinked", async () => {
    const tariff = await db.requirement.findFirstOrThrow({ where: { title: "Seed: Tariff computation" }, include: { testCases: true } });
    expect(tariff.moduleId).not.toBeNull();
    expect(tariff.processId).not.toBeNull();
    expect(tariff.testCases.every((c) => c.status === "DRAFT" && !c.aiGenerated)).toBe(true);

    const p2p = await db.requirement.findFirstOrThrow({ where: { title: "Seed: Inventory movements" } });
    expect(p2p.moduleId).toBeNull(); // P2P module isn't in this test database
  });
});

describe("generation store", () => {
  it("allows one active job per requirement and expires stale ones", async () => {
    const req = await db.requirement.create({ data: { title: "Penalty rule", text: "Penalty after the due date.", source: "paste" } });
    const now = new Date();

    const a = await createGenerationJob(db, req.id, now);
    expect(a.ok).toBe(true);
    const b = await createGenerationJob(db, req.id, now);
    expect(b).toEqual({ ok: false, message: "Generation is already running for this requirement." });

    const later = new Date(now.getTime() + STALE_JOB_MS + 1000);
    const c = await createGenerationJob(db, req.id, later);
    expect(c.ok).toBe(true);
    const stale = await db.generationJob.findUniqueOrThrow({ where: { id: a.ok ? a.jobId : "" } });
    expect(stale.status).toBe("ERROR");
  });

  it("replaces only unapproved AI drafts and keeps sort order going", async () => {
    const req = await db.requirement.create({ data: { title: "Tier rule", text: "Tiers apply per class.", source: "paste" } });
    const store = generationStore(db);

    await store.saveDrafts(req.id, [draft("A"), draft("B")], ["Q1"], true);
    const a = await db.testCase.findFirstOrThrow({ where: { requirementId: req.id, title: "A" } });
    await db.testCase.update({ where: { id: a.id }, data: { status: "APPROVED" } });
    await db.testCase.create({ data: { requirementId: req.id, title: "Manual", technique: "Decision table", steps: ["x"], expected: "y", type: "UI", sortOrder: 3 } });

    await store.saveDrafts(req.id, [draft("C")], ["Q2"], true);
    const cases = await db.testCase.findMany({ where: { requirementId: req.id }, orderBy: { sortOrder: "asc" } });
    expect(cases.map((c) => [c.title, c.sortOrder])).toEqual([
      ["A", 1],
      ["Manual", 3],
      ["C", 4],
    ]);
    expect((await db.requirement.findUniqueOrThrow({ where: { id: req.id } })).openQuestions).toEqual(["Q2"]);

    await store.saveDrafts(req.id, [draft("D")], ["Q3", "Q2"], false);
    expect((await db.requirement.findUniqueOrThrow({ where: { id: req.id } })).openQuestions).toEqual(["Q2", "Q3"]);
    expect(await db.testCase.count({ where: { requirementId: req.id } })).toBe(4);
  });

  it("loads requirement context with process steps", async () => {
    const proc = await db.businessProcess.findFirstOrThrow({ where: { name: "Meter-to-Cash" } });
    const req = await db.requirement.create({ data: { title: "Ctx", text: "Some text here.", source: "paste", sensitive: true, processId: proc.id, moduleId: proc.moduleId } });
    const ctx = await generationStore(db).loadRequirement(req.id);
    expect(ctx).toMatchObject({ sensitive: true, module: "Billing & Collection", process: { name: "Meter-to-Cash", steps: ["Apply penalties after due date"] } });
  });
});

describe("export and traceability loaders", () => {
  it("export skips obsolete cases and reads JSON lists", async () => {
    const req = await db.requirement.create({ data: { title: "Export me", text: "Export requirement text.", source: "paste" } });
    await generationStore(db).saveDrafts(req.id, [draft("Keep"), draft("Drop")], [], false);
    await db.testCase.updateMany({ where: { requirementId: req.id, title: "Drop" }, data: { status: "OBSOLETE" } });

    const rows = await loadExportCases(db, req.id);
    expect(rows.map((r) => r.title)).toEqual(["Keep"]);
    expect(rows[0]).toMatchObject({ requirement: "Export me", steps: ["Do it"], tags: ["@critical"], openQuestions: ["Rounding?"], aiGenerated: true });
  });

  it("traceability inputs include every requirement with its cases", async () => {
    const { requirements } = await loadTraceInputs(db);
    const exp = requirements.find((r) => r.title === "Export me");
    expect(exp?.cases.map((c) => c.title)).toEqual(["Keep", "Drop"]);
    expect(exp?.cases[0].results).toEqual([]);
  });
});
