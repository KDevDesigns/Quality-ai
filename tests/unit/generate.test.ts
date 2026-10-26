import { describe, expect, it } from "vitest";
import type { TaskRequest, TaskResult } from "@/lib/ai";
import { AiUnavailableError, BudgetExceededError } from "@/lib/ai/errors";
import type { TestCaseDraft, TestCaseDraftSet } from "@/lib/ai/schemas/test-case-draft";
import { generationErrorMessage, runGeneration, type GenerationDeps, type JobPatch, type RequirementContext } from "@/lib/test-design/generate";
import type { NormalizedDraft } from "@/lib/test-design/normalize";

const draft = (title: string, technique: TestCaseDraft["technique"] = "Boundary value analysis"): TestCaseDraft => ({
  title,
  technique,
  priority: "P1",
  type: "API",
  preconditions: "",
  steps: ["Do it"],
  expected: "Matches the tariff oracle",
  tags: ["@critical"],
  processStep: null,
  openQuestions: [],
});

const requirement: RequirementContext = {
  id: "r1",
  title: "Penalty rule",
  text: "Penalty applies to account 1234-5678 after the due date.",
  sensitive: true,
  module: "Billing & Collection",
  process: { name: "Meter-to-Cash", description: null, steps: ["Apply penalties after due date"] },
};

function setup(run: (req: TaskRequest<TestCaseDraftSet>) => Promise<Partial<TaskResult<TestCaseDraftSet>>>) {
  const jobs: JobPatch[] = [];
  const saved: { cases: NormalizedDraft[]; questions: string[]; replace: boolean }[] = [];
  const calls: TaskRequest<TestCaseDraftSet>[] = [];
  const deps: GenerationDeps = {
    runTask: async (req) => {
      calls.push(req);
      const r = await run(req);
      return { text: "", route: "claude-sonnet-5-5", redacted: true, redactionCount: 2, tokensIn: 900, tokensOut: 4000, costMicroUsd: 63_000, ...r } as TaskResult<TestCaseDraftSet>;
    },
    store: {
      loadRequirement: async (id) => (id === "r1" ? requirement : null),
      updateJob: async (_id, patch) => {
        jobs.push(patch);
      },
      saveDrafts: async (_id, cases, questions, replace) => {
        saved.push({ cases, questions, replace });
        return cases.length;
      },
    },
    glossary: async () => "- **OR**: Official Receipt",
    roles: async () => [],
    now: () => new Date("2026-10-26T08:00:00Z"),
  };
  return { deps, jobs, saved, calls };
}

describe("runGeneration", () => {
  it("sends the sensitive flag, schema and glossary, then saves drafts and finishes the job", async () => {
    const { deps, jobs, saved, calls } = setup(async () => ({ output: { cases: [draft("At due date"), draft("Day after", "Negative / abuse")], openQuestions: ["Holiday rule?"] } }));
    await runGeneration({ id: "j1", requirementId: "r1", replaceDrafts: true }, deps);

    expect(calls[0]).toMatchObject({ task: "testcase_generation", sensitive: true, jobId: "j1" });
    expect(calls[0].schema).toBeDefined();
    expect(calls[0].instructions).toContain("Official Receipt");
    expect(calls[0].instructions).not.toContain("1234-5678");
    expect(calls[0].input).toContain("1234-5678"); // the router redacts the input; it must reach runTask intact

    expect(saved[0].cases.map((c) => c.title)).toEqual(["At due date", "Day after"]);
    expect(saved[0]).toMatchObject({ questions: ["Holiday rule?"], replace: true });
    expect(jobs.map((j) => j.status)).toEqual(["RUNNING", "DONE"]);
    expect(jobs[1]).toMatchObject({ caseCount: 2, redactionCount: 2, tokensIn: 900, tokensOut: 4000, costMicroUsd: 63_000 });
  });

  it("notes dropped cases as an open question", async () => {
    const { deps, saved } = setup(async () => ({ output: { cases: [draft("Good"), { ...draft("Bad"), steps: [] }], openQuestions: [] } }));
    await runGeneration({ id: "j1", requirementId: "r1", replaceDrafts: false }, deps);
    expect(saved[0].questions).toEqual(["1 generated case(s) were incomplete and were dropped."]);
  });

  it("fails the job with the router's message when Ollama is down", async () => {
    const { deps, jobs, saved } = setup(async () => {
      throw new AiUnavailableError();
    });
    await runGeneration({ id: "j1", requirementId: "r1", replaceDrafts: true }, deps);
    expect(saved).toHaveLength(0);
    expect(jobs.at(-1)).toMatchObject({ status: "ERROR", error: expect.stringContaining("never fall back to the cloud") });
  });

  it("fails the job when the model returns no usable cases", async () => {
    const { deps, jobs } = setup(async () => ({ output: { cases: [], openQuestions: [] } }));
    await runGeneration({ id: "j1", requirementId: "r1", replaceDrafts: true }, deps);
    expect(jobs.at(-1)).toMatchObject({ status: "ERROR", error: expect.stringContaining("no usable test cases") });
  });

  it("fails the job when the requirement is gone", async () => {
    const { deps, jobs, calls } = setup(async () => ({ output: { cases: [draft("x")], openQuestions: [] } }));
    await runGeneration({ id: "j1", requirementId: "missing", replaceDrafts: true }, deps);
    expect(calls).toHaveLength(0);
    expect(jobs.at(-1)?.status).toBe("ERROR");
  });
});

describe("generationErrorMessage", () => {
  const named = (name: string) => Object.assign(new Error("request body: secret customer text"), { name });

  it("passes AiError messages through", () => {
    expect(generationErrorMessage(new BudgetExceededError(10_000_000, 10_000_000))).toContain("Monthly cloud AI budget reached");
  });

  it("never echoes the raw error message of other errors", () => {
    for (const name of ["AI_NoObjectGeneratedError", "AI_APICallError", "TimeoutError", "Error"]) {
      expect(generationErrorMessage(named(name))).not.toContain("secret");
    }
    expect(generationErrorMessage(named("AI_NoObjectGeneratedError"))).toContain("didn't match the test-case format");
  });
});
