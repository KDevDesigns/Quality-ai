import { describe, expect, it } from "vitest";
import { buildTraceability } from "@/lib/test-design/traceability";

const at = (s: string) => new Date(`2026-10-${s}T08:00:00Z`);

describe("buildTraceability", () => {
  const requirements = [
    {
      id: "r1",
      title: "Penalty rule",
      module: "Billing & Collection",
      cases: [
        { id: "c1", title: "On due date", status: "APPROVED", priority: "P1", results: [{ status: "FAIL", at: at("20") }, { status: "PASS", at: at("25") }] },
        { id: "c2", title: "One day late", status: "AUTOMATED", priority: "P1", results: [{ status: "FLAKY", at: at("25") }] },
        { id: "c3", title: "Holiday", status: "DRAFT", priority: "P2", results: [] },
        { id: "c4", title: "Old case", status: "OBSOLETE", priority: "P3", results: [] },
      ],
    },
    { id: "r2", title: "Empty", module: null, cases: [] },
  ];
  const defects = [
    { id: "d1", title: "Penalty on due date", status: "CONFIRMED", linkedTestCaseIds: ["c2", "c3"] },
    { id: "d2", title: "Old bug", status: "CLOSED", linkedTestCaseIds: ["c1"] },
    { id: "d3", title: "Bad JSON", status: "DRAFT", linkedTestCaseIds: "oops" },
  ];

  const rows = buildTraceability(requirements, defects);

  it("uses the most recent result and treats no results as NOT_RUN", () => {
    expect(rows[0].cases.map((c) => [c.id, c.latest])).toEqual([
      ["c1", "PASS"],
      ["c2", "FLAKY"],
      ["c3", "NOT_RUN"],
    ]);
  });

  it("links defects by case and counts each open defect once", () => {
    expect(rows[0].cases[1].defects.map((d) => d.id)).toEqual(["d1"]);
    expect(rows[0].cases[0].defects.map((d) => d.id)).toEqual(["d2"]);
    expect(rows[0].counts).toEqual({ cases: 3, approved: 2, pass: 1, fail: 1, notRun: 1, openDefects: 1 });
  });

  it("keeps requirements with no cases", () => {
    expect(rows[1].counts.cases).toBe(0);
  });
});
