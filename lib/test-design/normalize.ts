import type { TestCaseDraft } from "@/lib/ai/schemas/test-case-draft";
import { normalizeTags, testCaseInput, type TestCaseInput } from "@/lib/schemas/test-case";

export type NormalizedDraft = TestCaseInput & { processStep: string | null; openQuestions: string[] };

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);

/** Model steps sometimes arrive numbered ("1. Open…"); the UI numbers them itself. */
const unnumber = (s: string) => s.replace(/^\s*(\d+[.)]|[-*•])\s+/, "").trim();

function questions(list: string[], max: number): string[] {
  return [...new Set(list.map((q) => clip(q.trim(), 500)).filter(Boolean))].slice(0, max);
}

/**
 * Trims each draft to the column limits and validates it. Cases that still fail validation are dropped and counted,
 * so one malformed case doesn't cost the whole generation.
 */
export function normalizeDrafts(drafts: TestCaseDraft[], openQuestions: string[]) {
  const cases: NormalizedDraft[] = [];
  let dropped = 0;
  for (const d of drafts) {
    const parsed = testCaseInput.safeParse({
      title: clip(d.title.trim(), 200),
      technique: d.technique,
      priority: d.priority,
      type: d.type,
      preconditions: clip(d.preconditions.trim(), 2000),
      steps: d.steps.map(unnumber).filter(Boolean).slice(0, 30).map((s) => clip(s, 500)),
      expected: clip(d.expected.trim(), 2000),
      tags: normalizeTags(d.tags).slice(0, 12),
    });
    if (!parsed.success) {
      dropped++;
      continue;
    }
    cases.push({ ...parsed.data, processStep: d.processStep ? clip(d.processStep.trim(), 200) : null, openQuestions: questions(d.openQuestions, 10) });
  }
  return { cases, dropped, openQuestions: questions(openQuestions, 30) };
}
