"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { runTask } from "@/lib/ai";
import { redact, type RedactFinding } from "@/lib/ai/redact";
import { getAiSettings } from "@/lib/ai/store";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, lines, text, type FormState } from "@/lib/form";
import { requirementInput, splitTags, testCaseInput, TEST_CASE_STATUSES } from "@/lib/schemas/test-case";
import { importCatalog } from "@/lib/test-design/catalog";
import { readGlossary, readRoles } from "@/lib/test-design/docs";
import { runGeneration } from "@/lib/test-design/generate";
import { catalogStore, createGenerationJob, generationStore } from "@/lib/test-design/store";

function revalidate(requirementId?: string) {
  revalidatePath("/test-design");
  revalidatePath("/test-design/traceability");
  if (requirementId) revalidatePath(`/test-design/${requirementId}`);
}

export type SaveRequirementState = FormState & { id?: string };

export async function saveRequirement(_prev: SaveRequirementState, fd: FormData): Promise<SaveRequirementState> {
  const parsed = requirementInput.safeParse({
    title: text(fd, "title"),
    text: text(fd, "text"),
    moduleId: text(fd, "moduleId"),
    processId: text(fd, "processId"),
    sensitive: fd.get("sensitive") === "on",
    source: text(fd, "source") || "paste",
    sourceFile: text(fd, "sourceFile"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const data = { ...parsed.data };

  if (data.processId) {
    const proc = await db.businessProcess.findUnique({ where: { id: data.processId }, select: { moduleId: true } });
    if (!proc) return { ok: false, message: "The selected process no longer exists.", fieldErrors: { processId: ["Pick another process."] } };
    if (data.moduleId && proc.moduleId !== data.moduleId) {
      return { ok: false, message: "The selected process belongs to a different module.", fieldErrors: { processId: ["Pick a process from the selected module."] } };
    }
    data.moduleId = proc.moduleId;
  }

  const id = text(fd, "id");
  try {
    const row = id
      ? await db.requirement.update({ where: { id }, data: { ...data, source: undefined, sourceFile: undefined } })
      : await db.requirement.create({ data });
    revalidate(row.id);
    return { ok: true, id: row.id };
  } catch (e) {
    return fromDbError(e);
  }
}

/** Approved and automated cases are the traceability record, so a requirement that has them can't be deleted. */
export async function deleteRequirement(id: string): Promise<FormState> {
  const kept = await db.testCase.count({ where: { requirementId: id, status: { in: ["APPROVED", "AUTOMATED"] } } });
  if (kept) return { ok: false, message: `This requirement has ${kept} approved or automated case(s). Mark them obsolete first.` };
  try {
    await db.$transaction([db.testCase.deleteMany({ where: { requirementId: id } }), db.requirement.delete({ where: { id } })]);
  } catch (e) {
    return fromDbError(e);
  }
  revalidate();
  redirect("/test-design");
}

export async function importSeedCatalog(): Promise<FormState> {
  const raw = JSON.parse(await readFile(path.join(process.cwd(), "data", "seed-catalog.json"), "utf8"));
  const r = await importCatalog(raw, catalogStore(db));
  revalidate();
  if (!r.created) return { ok: true, message: `Already imported (${r.skipped} areas).` };
  return { ok: true, message: `Imported ${r.created} areas with ${r.cases} draft cases${r.skipped ? `; ${r.skipped} were already there` : ""}.` };
}

export type StartGenerationResult = { ok: true; jobId: string } | { ok: false; message: string };

/** Queues generation and returns at once; the job runs after the response and the page polls its status. */
export async function startGeneration(requirementId: string, replaceDrafts: boolean): Promise<StartGenerationResult> {
  const exists = await db.requirement.findUnique({ where: { id: requirementId }, select: { id: true } });
  if (!exists) return { ok: false, message: "The requirement no longer exists. Refresh the page." };

  const started = await createGenerationJob(db, requirementId);
  if (!started.ok) return started;

  after(() =>
    runGeneration(
      { id: started.jobId, requirementId, replaceDrafts },
      { runTask, store: generationStore(db), glossary: readGlossary, roles: readRoles, now: () => new Date() },
    ),
  );
  return { ok: true, jobId: started.jobId };
}

export type RequirementRedactionPreview = { text: string; findings: RedactFinding[]; total: number };

/** Rule-based pass only, run on this machine. The optional local-model pass runs at generation time. */
export async function previewRequirementRedaction(requirementId: string): Promise<RequirementRedactionPreview | null> {
  const req = await db.requirement.findUnique({ where: { id: requirementId }, select: { title: true, text: true } });
  if (!req) return null;
  const s = await getAiSettings();
  const r = redact(`Requirement: ${req.title}\n\n${req.text}`, { names: s.redaction.names, patterns: s.redaction.patterns, amounts: s.redaction.amounts });
  return { text: r.text, findings: r.findings, total: r.total };
}

export async function saveTestCase(_prev: FormState, fd: FormData): Promise<FormState> {
  const requirementId = text(fd, "requirementId");
  const parsed = testCaseInput.safeParse({
    title: text(fd, "title"),
    technique: text(fd, "technique"),
    priority: text(fd, "priority"),
    type: text(fd, "type"),
    preconditions: text(fd, "preconditions"),
    steps: lines(fd, "steps").map((s) => s.replace(/^\s*\d+[.)]\s+/, "")),
    expected: text(fd, "expected"),
    tags: splitTags(text(fd, "tags")),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = text(fd, "id");
  try {
    if (id) {
      const current = await db.testCase.findUniqueOrThrow({ where: { id }, select: { status: true } });
      if (current.status === "AUTOMATED") return { ok: false, message: "Automated cases change through the spec review, not here." };
      // An edited case needs a fresh review, so approval is cleared.
      const reset = current.status === "APPROVED" ? { status: "DRAFT" as const, approvedAt: null } : {};
      await db.testCase.update({ where: { id }, data: { ...parsed.data, ...reset } });
    } else {
      const req = await db.requirement.findUniqueOrThrow({ where: { id: requirementId }, select: { processId: true } });
      const last = await db.testCase.aggregate({ where: { requirementId }, _max: { sortOrder: true } });
      await db.testCase.create({ data: { ...parsed.data, requirementId, processId: req.processId, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    }
  } catch (e) {
    return fromDbError(e);
  }
  revalidate(requirementId);
  return { ok: true };
}

export type BulkAction = "approve" | "draft" | "obsolete" | "delete";

export async function bulkUpdateCases(requirementId: string, ids: string[], action: BulkAction): Promise<FormState> {
  if (!ids.length) return { ok: false, message: "Select at least one case." };
  const where = { id: { in: ids }, requirementId };
  if (action === "delete") {
    // Only drafts can be deleted; approved cases are kept for traceability and are marked obsolete instead.
    const r = await db.testCase.deleteMany({ where: { ...where, status: "DRAFT" } });
    revalidate(requirementId);
    const kept = ids.length - r.count;
    return { ok: true, message: `Deleted ${r.count} draft(s).${kept ? ` ${kept} non-draft case(s) were kept; mark them obsolete instead.` : ""}` };
  }

  const status = ({ approve: "APPROVED", draft: "DRAFT", obsolete: "OBSOLETE" } as const)[action];
  if (!(TEST_CASE_STATUSES as readonly string[]).includes(status)) return { ok: false, message: "Unknown action." };
  // AUTOMATED cases already have a reviewed spec; only Phase 5's pipeline moves them. Cases already in the
  // target status are skipped so approving twice keeps the first approval time.
  const r = await db.testCase.updateMany({
    where: { ...where, status: { notIn: ["AUTOMATED", status] } },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : null },
  });
  revalidate(requirementId);
  return { ok: true, message: `Updated ${r.count} case(s).` };
}
