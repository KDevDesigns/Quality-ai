import { z } from "zod";
import { optionalText } from "./common";

/** PLAN §6.2. Every test case carries exactly one of these labels. */
export const TECHNIQUES = [
  "Equivalence partitioning",
  "Boundary value analysis",
  "Decision table",
  "State transition",
  "Negative / abuse",
  "Role-based",
  "Data-driven",
] as const;
export type Technique = (typeof TECHNIQUES)[number];

export const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
export const TEST_TYPES = ["UI", "API", "PROCESS", "RECON", "NFR"] as const;
export const TEST_CASE_STATUSES = ["DRAFT", "APPROVED", "AUTOMATED", "OBSOLETE"] as const;
export const REQUIREMENT_SOURCES = ["paste", "upload", "seed"] as const;

/** PLAN §6.3 tag syntax. */
export const TAG_RE = /^@(smoke|critical|regression|(process|module|role):[a-z0-9][a-z0-9-]*)$/;

const SLUG_TAG = /^@(process|module|role):(.+)$/;

/** Lower-cases, slugs the value part of `@kind:value` tags, and drops anything that still isn't a valid tag. */
export function normalizeTags(raw: Iterable<string>): string[] {
  const out = new Set<string>();
  for (const r of raw) {
    let t = r.trim().toLowerCase();
    if (!t) continue;
    if (!t.startsWith("@")) t = "@" + t;
    const m = SLUG_TAG.exec(t);
    if (m) {
      const slug = m[2].normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      t = slug ? `@${m[1]}:${slug}` : "";
    }
    if (TAG_RE.test(t)) out.add(t);
  }
  return [...out];
}

export function splitTags(s: string): string[] {
  return normalizeTags(s.split(/[\s,]+/));
}

export const requirementInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  text: z.string().trim().min(20, "Paste at least a sentence or two").max(60_000, "Keep it under 60,000 characters; split longer documents"),
  moduleId: optionalText(100),
  processId: optionalText(100),
  sensitive: z.boolean(),
  source: z.enum(REQUIREMENT_SOURCES),
  sourceFile: optionalText(255),
});
export type RequirementInput = z.infer<typeof requirementInput>;

export const testCaseInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  technique: z.enum(TECHNIQUES, "Pick a technique"),
  priority: z.enum(PRIORITIES),
  type: z.enum(TEST_TYPES),
  preconditions: optionalText(),
  steps: z.array(z.string().trim().min(1).max(500)).min(1, "Add at least one step").max(30),
  expected: z.string().trim().min(1, "Expected result is required").max(2000),
  tags: z.array(z.string().regex(TAG_RE)).max(12),
});
export type TestCaseInput = z.infer<typeof testCaseInput>;

export function readStringList(json: unknown): string[] {
  const r = z.array(z.string()).safeParse(json);
  return r.success ? r.data : [];
}
