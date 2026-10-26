import { describe, expect, it } from "vitest";
import { buildTestCaseInput, buildTestCaseInstructions, MIN_CASES } from "@/lib/ai/prompts/testcase-generation";
import { TECHNIQUES } from "@/lib/schemas/test-case";
import { parseRoles } from "@/lib/test-design/docs";

const base = { glossary: "- **OR**: Official Receipt", module: "Billing & Collection", process: null, roles: [] };

describe("buildTestCaseInstructions", () => {
  it("includes the glossary, every technique and the case target", () => {
    const s = buildTestCaseInstructions(base);
    expect(s).toContain("**OR**: Official Receipt");
    for (const t of TECHNIQUES) expect(s).toContain(t);
    expect(s).toContain(`at least ${MIN_CASES} cases`);
  });

  it("forbids computed money and invented rules (hard rule 8, PLAN §7.3)", () => {
    const s = buildTestCaseInstructions(base);
    expect(s).toMatch(/Never compute an amount/);
    expect(s).toMatch(/tariff oracle/);
    expect(s).toMatch(/Never invent a business rule/);
    expect(s).toContain('"unknown"');
  });

  it("lists process steps in order", () => {
    const s = buildTestCaseInstructions({ ...base, process: { name: "Order of Payment", description: "Pending → Paid", steps: ["Create OP", "Pay"] } });
    expect(s).toContain("Business process: Order of Payment — Pending → Paid");
    expect(s).toContain("1. Create OP\n2. Pay");
  });

  it("names roles when documented and asks otherwise", () => {
    expect(buildTestCaseInstructions({ ...base, roles: ["Teller", "Billing supervisor"] })).toContain("ERP roles for role-based cases: Teller, Billing supervisor");
    expect(buildTestCaseInstructions(base)).toContain("ERP roles are not documented yet");
  });

  it("keeps the requirement text out of the instructions", () => {
    expect(buildTestCaseInput({ title: "Penalty rule", text: "A penalty applies after the due date." })).toBe(
      "Requirement: Penalty rule\n\nA penalty applies after the due date.",
    );
  });
});

describe("parseRoles", () => {
  it("reads the first column after the header", () => {
    const md = "# Roles\n\n| Role | Module |\n|---|---|\n| **Teller** | Billing |\n| Billing supervisor | Billing |\n| Teller | Billing |\n";
    expect(parseRoles(md)).toEqual(["Teller", "Billing supervisor"]);
  });

  it("returns nothing for the empty stub", () => {
    expect(parseRoles("| Role | Module | May do | May not do |\n|---|---|---|---|\n")).toEqual([]);
  });
});
