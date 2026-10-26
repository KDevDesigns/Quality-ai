import type { TaskRequest, TaskResult } from "@/lib/ai";
import { AiError } from "@/lib/ai/errors";
import { buildTestCaseInput, buildTestCaseInstructions } from "@/lib/ai/prompts/testcase-generation";
import { testCaseDraftSet, type TestCaseDraftSet } from "@/lib/ai/schemas/test-case-draft";
import { normalizeDrafts, type NormalizedDraft } from "./normalize";

/** A job still QUEUED or RUNNING after this long was cut off (usually by a dev-server restart). */
export const STALE_JOB_MS = 10 * 60_000;

export type RequirementContext = {
  id: string;
  title: string;
  text: string;
  sensitive: boolean;
  module: string | null;
  process: { name: string; description: string | null; steps: string[] } | null;
};

export type JobPatch = {
  status: "RUNNING" | "DONE" | "ERROR";
  caseCount?: number;
  redactionCount?: number;
  tokensIn?: number;
  tokensOut?: number;
  costMicroUsd?: number;
  error?: string | null;
  finishedAt?: Date;
};

export interface GenerationStore {
  loadRequirement(id: string): Promise<RequirementContext | null>;
  updateJob(jobId: string, patch: JobPatch): Promise<void>;
  /** Saves new DRAFT cases; with replaceDrafts, first removes the requirement's unapproved AI drafts. Returns the count saved. */
  saveDrafts(requirementId: string, cases: NormalizedDraft[], openQuestions: string[], replaceDrafts: boolean): Promise<number>;
}

export type GenerationDeps = {
  runTask: (req: TaskRequest<TestCaseDraftSet>) => Promise<TaskResult<TestCaseDraftSet>>;
  store: GenerationStore;
  glossary: () => Promise<string>;
  roles: () => Promise<string[]>;
  now: () => Date;
};

export type GenerationJobRef = { id: string; requirementId: string; replaceDrafts: boolean };

/** Messages here are shown in the UI, so they never echo the requirement text or the model's answer. */
export function generationErrorMessage(e: unknown): string {
  if (e instanceof AiError) return e.message;
  const name = e instanceof Error ? e.name : "";
  if (name === "AI_NoObjectGeneratedError") return "The model's answer didn't match the test-case format. Try again.";
  if (name === "AbortError" || name === "TimeoutError") return "The model took too long to answer. Try again, or split the requirement.";
  if (name === "AI_APICallError") return "The AI provider returned an error. Check Settings → provider health, then try again.";
  return "Generation failed unexpectedly. See the server log for details.";
}

export async function runGeneration(job: GenerationJobRef, deps: GenerationDeps): Promise<void> {
  const { store } = deps;
  try {
    await store.updateJob(job.id, { status: "RUNNING" });
    const req = await store.loadRequirement(job.requirementId);
    if (!req) throw new Error("Requirement not found");

    const [glossary, roles] = await Promise.all([deps.glossary(), deps.roles()]);
    const result = await deps.runTask({
      task: "testcase_generation",
      sensitive: req.sensitive,
      instructions: buildTestCaseInstructions({ glossary, module: req.module, process: req.process, roles }),
      input: buildTestCaseInput(req),
      schema: testCaseDraftSet,
      jobId: job.id,
    });

    const { cases, dropped, openQuestions } = normalizeDrafts(result.output.cases, result.output.openQuestions);
    if (!cases.length) throw new GenerationError("The model returned no usable test cases. Add more detail to the requirement and try again.");
    if (dropped) openQuestions.push(`${dropped} generated case(s) were incomplete and were dropped.`);

    const saved = await store.saveDrafts(req.id, cases, openQuestions, job.replaceDrafts);
    await store.updateJob(job.id, {
      status: "DONE",
      caseCount: saved,
      redactionCount: result.redactionCount,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costMicroUsd: result.costMicroUsd,
      finishedAt: deps.now(),
    });
  } catch (e) {
    // Name and message only: AI SDK errors carry the request body, which can hold the requirement text.
    if (!(e instanceof AiError || e instanceof GenerationError)) {
      console.error(`[test-design] generation ${job.id} failed: ${e instanceof Error ? `${e.name}: ${e.message.slice(0, 300)}` : "unknown error"}`);
    }
    const error = e instanceof GenerationError ? e.message : generationErrorMessage(e);
    await store.updateJob(job.id, { status: "ERROR", error, finishedAt: deps.now() });
  }
}

class GenerationError extends Error {}
