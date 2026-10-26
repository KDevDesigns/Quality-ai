import { readStringList } from "@/lib/schemas/test-case";

export type TraceCaseInput = {
  id: string;
  title: string;
  status: string;
  priority: string;
  results: { status: string; at: Date }[];
};

export type TraceRequirementInput = {
  id: string;
  title: string;
  module: string | null;
  cases: TraceCaseInput[];
};

export type TraceDefectInput = { id: string; title: string; status: string; linkedTestCaseIds: unknown };

export type LatestResult = "PASS" | "FAIL" | "SKIP" | "FLAKY" | "NOT_RUN";

export type TraceCase = {
  id: string;
  title: string;
  status: string;
  priority: string;
  latest: LatestResult;
  defects: { id: string; title: string; status: string }[];
};

export type TraceRow = {
  id: string;
  title: string;
  module: string | null;
  cases: TraceCase[];
  counts: { cases: number; approved: number; pass: number; fail: number; notRun: number; openDefects: number };
};

const CLOSED_DEFECT = new Set(["VERIFIED", "CLOSED", "REJECTED"]);
const RESULTS = new Set<LatestResult>(["PASS", "FAIL", "SKIP", "FLAKY"]);

/** Requirement → cases → latest result → defects (PLAN §8, Phase 3). Obsolete cases are left out. */
export function buildTraceability(requirements: TraceRequirementInput[], defects: TraceDefectInput[]): TraceRow[] {
  const defectsByCase = new Map<string, TraceCase["defects"]>();
  for (const d of defects) {
    for (const caseId of readStringList(d.linkedTestCaseIds)) {
      const list = defectsByCase.get(caseId) ?? [];
      list.push({ id: d.id, title: d.title, status: d.status });
      defectsByCase.set(caseId, list);
    }
  }

  return requirements.map((r) => {
    const cases: TraceCase[] = r.cases
      .filter((c) => c.status !== "OBSOLETE")
      .map((c) => {
        const last = [...c.results].sort((a, b) => b.at.getTime() - a.at.getTime())[0];
        const latest: LatestResult = last && RESULTS.has(last.status as LatestResult) ? (last.status as LatestResult) : "NOT_RUN";
        return { id: c.id, title: c.title, status: c.status, priority: c.priority, latest, defects: defectsByCase.get(c.id) ?? [] };
      });

    const openDefects = new Set(cases.flatMap((c) => c.defects.filter((d) => !CLOSED_DEFECT.has(d.status)).map((d) => d.id)));
    return {
      id: r.id,
      title: r.title,
      module: r.module,
      cases,
      counts: {
        cases: cases.length,
        approved: cases.filter((c) => c.status === "APPROVED" || c.status === "AUTOMATED").length,
        pass: cases.filter((c) => c.latest === "PASS").length,
        fail: cases.filter((c) => c.latest === "FAIL" || c.latest === "FLAKY").length,
        notRun: cases.filter((c) => c.latest === "NOT_RUN").length,
        openDefects: openDefects.size,
      },
    };
  });
}
