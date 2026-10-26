import { describe, expect, it } from "vitest";
import { coverage } from "@/lib/test-design/coverage";

const c = (technique: string, status = "DRAFT", priority = "P2") => ({ technique, status, priority });

describe("coverage", () => {
  it("has no warnings for an empty requirement", () => {
    expect(coverage([]).warnings).toEqual([]);
  });

  it("warns about too few cases and missing boundary and negative cases", () => {
    const r = coverage([c("Equivalence partitioning"), c("State transition")]);
    expect(r.warnings).toEqual(["Only 2 case(s); aim for at least 15.", "No boundary value cases.", "No negative cases."]);
  });

  it("is clean at 15 cases with boundaries and negatives", () => {
    const cases = [c("Boundary value analysis"), c("Negative / abuse"), ...Array.from({ length: 13 }, () => c("Decision table"))];
    const r = coverage(cases);
    expect(r.total).toBe(15);
    expect(r.warnings).toEqual([]);
    expect(r.byTechnique["Decision table"]).toBe(13);
  });

  it("ignores obsolete cases and counts approved ones", () => {
    const r = coverage([c("Boundary value analysis", "OBSOLETE"), c("Negative / abuse", "APPROVED", "P1"), c("Data-driven", "AUTOMATED")]);
    expect(r.total).toBe(2);
    expect(r.approved).toBe(2);
    expect(r.byTechnique["Boundary value analysis"]).toBe(0);
    expect(r.byPriority.P1).toBe(1);
    expect(r.warnings).toContain("No boundary value cases.");
  });
});
