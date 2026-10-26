import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { ModuleCodeValue } from "@/lib/schemas/common";
import { readStringList } from "@/lib/schemas/test-case";
import { readSteps } from "@/lib/schemas/process";
import type { CatalogStore } from "./catalog";
import type { ExportCase } from "./export";
import { STALE_JOB_MS, type GenerationStore } from "./generate";
import type { TraceDefectInput, TraceRequirementInput } from "./traceability";

// Prisma glue for lib/test-design. Takes the client as a parameter so tests can run it against a throwaway SQLite file.

export function generationStore(db: PrismaClient): GenerationStore {
  return {
    async loadRequirement(id) {
      const r = await db.requirement.findUnique({
        where: { id },
        include: { module: { select: { name: true } }, process: { select: { name: true, description: true, steps: true } } },
      });
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        text: r.text,
        sensitive: r.sensitive,
        module: r.module?.name ?? null,
        process: r.process ? { name: r.process.name, description: r.process.description, steps: readSteps(r.process.steps).map((s) => s.name) } : null,
      };
    },

    async updateJob(jobId, patch) {
      await db.generationJob.update({ where: { id: jobId }, data: patch });
    },

    async saveDrafts(requirementId, cases, openQuestions, replaceDrafts) {
      return db.$transaction(async (tx) => {
        const req = await tx.requirement.findUniqueOrThrow({ where: { id: requirementId }, select: { processId: true, openQuestions: true } });
        if (replaceDrafts) await tx.testCase.deleteMany({ where: { requirementId, status: "DRAFT", aiGenerated: true } });
        const last = await tx.testCase.aggregate({ where: { requirementId }, _max: { sortOrder: true } });
        const start = (last._max.sortOrder ?? 0) + 1;
        await tx.testCase.createMany({
          data: cases.map((c, i) => ({
            requirementId,
            processId: req.processId,
            title: c.title,
            technique: c.technique,
            priority: c.priority,
            type: c.type,
            preconditions: c.preconditions,
            steps: c.steps,
            expected: c.expected,
            tags: c.tags,
            processStep: c.processStep,
            openQuestions: c.openQuestions,
            aiGenerated: true,
            sortOrder: start + i,
          })),
        });
        const questions = replaceDrafts ? openQuestions : [...new Set([...readStringList(req.openQuestions), ...openQuestions])];
        await tx.requirement.update({ where: { id: requirementId }, data: { openQuestions: questions } });
        return cases.length;
      });
    },
  };
}

export type StartResult = { ok: true; jobId: string } | { ok: false; message: string };

/** Creates a QUEUED job unless one is already active for the requirement. Jobs cut off by a restart are marked ERROR first. */
export async function createGenerationJob(db: PrismaClient, requirementId: string, now = new Date()): Promise<StartResult> {
  return db.$transaction(async (tx) => {
    await tx.generationJob.updateMany({
      where: { requirementId, status: { in: ["QUEUED", "RUNNING"] }, createdAt: { lt: new Date(now.getTime() - STALE_JOB_MS) } },
      data: { status: "ERROR", error: "Interrupted before it finished (was the server restarted?). Generate again.", finishedAt: now },
    });
    const active = await tx.generationJob.findFirst({ where: { requirementId, status: { in: ["QUEUED", "RUNNING"] } } });
    if (active) return { ok: false, message: "Generation is already running for this requirement." };
    const job = await tx.generationJob.create({ data: { requirementId } });
    return { ok: true, jobId: job.id };
  });
}

export function catalogStore(db: PrismaClient): CatalogStore {
  return {
    async seedTitles() {
      const rows = await db.requirement.findMany({ where: { source: "seed" }, select: { title: true } });
      return new Set(rows.map((r) => r.title));
    },
    async moduleIds() {
      const rows = await db.module.findMany({ select: { id: true, code: true } });
      return Object.fromEntries(rows.map((m) => [m.code, m.id])) as Partial<Record<ModuleCodeValue, string>>;
    },
    async processIds() {
      const rows = await db.businessProcess.findMany({ select: { id: true, name: true } });
      return Object.fromEntries(rows.map((p) => [p.name, p.id]));
    },
    async createSeedRequirement(r) {
      await db.requirement.create({
        data: {
          title: r.title,
          text: r.text,
          source: "seed",
          sensitive: false,
          moduleId: r.moduleId,
          processId: r.processId,
          testCases: {
            create: r.cases.map((c, i) => ({ ...c, processId: r.processId, aiGenerated: false, sortOrder: i + 1 })),
          },
        },
      });
    },
  };
}

export async function loadTraceInputs(db: PrismaClient, moduleId?: string): Promise<{ requirements: TraceRequirementInput[]; defects: TraceDefectInput[] }> {
  const [reqs, defects] = await Promise.all([
    db.requirement.findMany({
      where: moduleId ? { moduleId } : {},
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        module: { select: { name: true } },
        testCases: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, status: true, priority: true, results: { select: { status: true, run: { select: { createdAt: true } } } } },
        },
      },
    }),
    db.defect.findMany({ select: { id: true, title: true, status: true, linkedTestCaseIds: true } }),
  ]);
  return {
    requirements: reqs.map((r) => ({
      id: r.id,
      title: r.title,
      module: r.module?.name ?? null,
      cases: r.testCases.map((c) => ({ ...c, results: c.results.map((x) => ({ status: x.status, at: x.run.createdAt })) })),
    })),
    defects,
  };
}

export async function loadExportCases(db: PrismaClient, requirementId?: string): Promise<ExportCase[]> {
  const rows = await db.testCase.findMany({
    where: { status: { not: "OBSOLETE" }, ...(requirementId ? { requirementId } : {}) },
    orderBy: [{ requirement: { createdAt: "asc" } }, { sortOrder: "asc" }],
    include: { requirement: { select: { title: true } } },
  });
  return rows.map((c) => ({
    requirement: c.requirement?.title ?? "",
    id: c.id,
    title: c.title,
    technique: c.technique,
    priority: c.priority,
    type: c.type,
    status: c.status,
    processStep: c.processStep,
    preconditions: c.preconditions,
    steps: readStringList(c.steps),
    expected: c.expected,
    tags: readStringList(c.tags),
    openQuestions: readStringList(c.openQuestions),
    aiGenerated: c.aiGenerated,
  }));
}
