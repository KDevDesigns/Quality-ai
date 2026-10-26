import { z } from "zod";
import { PRIORITIES, TECHNIQUES, TEST_TYPES } from "@/lib/schemas/test-case";

// The schema the model fills in. Kept free of length limits and regexes so a slightly long field doesn't fail the
// whole generation; lib/test-design/normalize.ts trims and validates each case afterwards.

export const testCaseDraft = z.object({
  title: z.string().describe("Short, specific name of the check"),
  technique: z.enum(TECHNIQUES),
  priority: z.enum(PRIORITIES).describe("P1 = money, approvals or data loss; P4 = cosmetic"),
  type: z.enum(TEST_TYPES),
  preconditions: z.string().describe("Data and state needed before step 1; empty if none"),
  steps: z.array(z.string()).describe("Numbered actions without the numbers"),
  expected: z.string().describe("Observable result. For amounts, name the oracle or recon check; never a computed number"),
  tags: z.array(z.string()).describe("PLAN tags such as @critical, @module:billing, @process:meter-to-cash"),
  processStep: z.string().nullable().describe("The process step this case exercises, copied from the list, or null"),
  openQuestions: z.array(z.string()).describe("Rules this case depends on that the requirement leaves unknown"),
});
export type TestCaseDraft = z.infer<typeof testCaseDraft>;

export const testCaseDraftSet = z.object({
  cases: z.array(testCaseDraft),
  openQuestions: z.array(z.string()).describe("Questions for the requirement owner that apply to the requirement as a whole"),
});
export type TestCaseDraftSet = z.infer<typeof testCaseDraftSet>;
