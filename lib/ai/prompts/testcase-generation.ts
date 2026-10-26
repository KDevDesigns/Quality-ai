import { TECHNIQUES } from "@/lib/schemas/test-case";

export const MIN_CASES = 15;

export type TestCasePromptContext = {
  glossary: string;
  module: string | null;
  process: { name: string; description: string | null; steps: string[] } | null;
  roles: string[];
};

/** PLAN §7.3. Instructions only; the requirement text goes in the prompt so the router can redact it separately. */
export function buildTestCaseInstructions(ctx: TestCasePromptContext): string {
  const parts: string[] = [
    `You are a senior QA analyst designing test cases for DCWD's in-house web ERP (a water utility in the Philippines).
Write test cases for the requirement the user gives you.

Rules:
1. Label every case with exactly one technique: ${TECHNIQUES.join(", ")}.
2. Cover every numeric limit with boundary value analysis: exactly at the limit, one unit below and one unit above.
   Cover every listed status with state transitions, including transitions that must be rejected.
   Include negative cases: missing or invalid input, wrong role, duplicate submission, out-of-order steps.
3. Write at least ${MIN_CASES} cases when the requirement has enough rules to support them. Never pad with near-duplicates.
   If fewer are justified, say why in openQuestions.
4. Never invent a business rule. If a case depends on something the requirement doesn't say (a rate, a limit, a rounding rule,
   who may approve), write "unknown" in that part of the case and add the question to openQuestions.
5. Money is checked by code, not by you. Never compute an amount, balance, tax or penalty. For an expected amount, write what
   it must match, for example "bill lines match the tariff oracle" or "daily collection total = sum of ORs (recon check)".
6. Steps are short imperative actions a tester can follow in the ERP UI or API. Expected results must be observable.
7. Priority: P1 for money, approvals, segregation of duties or data loss; P2 for main-flow behavior; P3 for edge cases; P4 for cosmetic.
8. Type: UI, API, PROCESS (crosses several steps or modules), RECON (data invariant) or NFR.
9. Tags use only: @smoke, @critical, @regression, @module:<name>, @process:<name>, @role:<role>. Use lowercase with hyphens.
   Give P1 cases @critical.
10. Use test data with a "QA-" prefix. Use Filipino names with ñ where a name field is relevant.`,
  ];

  if (ctx.module) parts.push(`Module: ${ctx.module}`);
  if (ctx.process) {
    const steps = ctx.process.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    parts.push(
      `Business process: ${ctx.process.name}${ctx.process.description ? ` — ${ctx.process.description}` : ""}\nSteps (copy one into processStep when a case exercises it):\n${steps}`,
    );
  }
  if (ctx.roles.length) parts.push(`ERP roles for role-based cases: ${ctx.roles.join(", ")}`);
  else parts.push(`ERP roles are not documented yet. For role-based cases, describe the role ("a preparer", "an approver") and add an open question.`);

  parts.push(`Glossary:\n${ctx.glossary.trim()}`);
  return parts.join("\n\n");
}

export function buildTestCaseInput(req: { title: string; text: string }): string {
  return `Requirement: ${req.title}\n\n${req.text}`;
}
