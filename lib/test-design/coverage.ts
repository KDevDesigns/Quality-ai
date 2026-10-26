import { MIN_CASES } from "@/lib/ai/prompts/testcase-generation";
import { PRIORITIES, TECHNIQUES, type Technique } from "@/lib/schemas/test-case";

export type CoverageCase = { technique: string; priority: string; status: string };

export type Coverage = {
  total: number;
  approved: number;
  byTechnique: Record<Technique, number>;
  byPriority: Record<(typeof PRIORITIES)[number], number>;
  warnings: string[];
};

/** Obsolete cases don't count toward coverage. */
export function coverage(cases: CoverageCase[]): Coverage {
  const live = cases.filter((c) => c.status !== "OBSOLETE");
  const byTechnique = Object.fromEntries(TECHNIQUES.map((t) => [t, 0])) as Coverage["byTechnique"];
  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Coverage["byPriority"];
  for (const c of live) {
    if (c.technique in byTechnique) byTechnique[c.technique as Technique]++;
    if (c.priority in byPriority) byPriority[c.priority as keyof Coverage["byPriority"]]++;
  }

  const warnings: string[] = [];
  if (live.length) {
    if (live.length < MIN_CASES) warnings.push(`Only ${live.length} case(s); aim for at least ${MIN_CASES}.`);
    if (!byTechnique["Boundary value analysis"]) warnings.push("No boundary value cases.");
    if (!byTechnique["Negative / abuse"]) warnings.push("No negative cases.");
  }
  return { total: live.length, approved: live.filter((c) => c.status === "APPROVED" || c.status === "AUTOMATED").length, byTechnique, byPriority, warnings };
}
