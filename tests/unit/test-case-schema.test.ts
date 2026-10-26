import { describe, expect, it } from "vitest";
import { testCaseDraftSet, type TestCaseDraft } from "@/lib/ai/schemas/test-case-draft";
import { normalizeTags, splitTags, testCaseInput } from "@/lib/schemas/test-case";
import { normalizeDrafts } from "@/lib/test-design/normalize";

const draft = (over: Partial<TestCaseDraft> = {}): TestCaseDraft => ({
  title: "Reading lower than previous is rejected",
  technique: "Negative / abuse",
  priority: "P1",
  type: "UI",
  preconditions: "QA- account with previous reading 1200",
  steps: ["Open the account", "Enter 1199", "Save"],
  expected: "Reading is rejected",
  tags: ["@critical"],
  processStep: null,
  openQuestions: [],
  ...over,
});

describe("normalizeTags", () => {
  it("keeps valid PLAN §6.3 tags", () => {
    expect(normalizeTags(["@smoke", "@critical", "@regression", "@module:billing", "@role:teller"])).toEqual([
      "@smoke",
      "@critical",
      "@regression",
      "@module:billing",
      "@role:teller",
    ]);
  });

  it("slugs, lower-cases and adds the @", () => {
    expect(normalizeTags(["Critical", "@process:Meter-to-Cash", "@process:Hire-to-Retire / Time-to-Pay", "@role:Cashier Ñiño"])).toEqual([
      "@critical",
      "@process:meter-to-cash",
      "@process:hire-to-retire-time-to-pay",
      "@role:cashier-nino",
    ]);
  });

  it("drops unknown tags, empty values and duplicates", () => {
    expect(normalizeTags(["@fast", "@module:", "", "@smoke", "@SMOKE", "@priority:p1"])).toEqual(["@smoke"]);
  });

  it("splits a typed tag list on spaces and commas", () => {
    expect(splitTags("@smoke, @module:billing  @nope")).toEqual(["@smoke", "@module:billing"]);
  });
});

describe("testCaseDraftSet", () => {
  it("round-trips a valid model answer", () => {
    const value = { cases: [draft()], openQuestions: ["What is the abnormal-high threshold?"] };
    expect(testCaseDraftSet.parse(value)).toEqual(value);
  });

  it("rejects an unknown technique", () => {
    expect(testCaseDraftSet.safeParse({ cases: [{ ...draft(), technique: "Guesswork" }], openQuestions: [] }).success).toBe(false);
  });
});

describe("normalizeDrafts", () => {
  it("strips step numbers and bullets the UI adds itself", () => {
    const { cases } = normalizeDrafts([draft({ steps: ["1. Open", "2) Enter 1199", "- Save", "  "] })], []);
    expect(cases[0].steps).toEqual(["Open", "Enter 1199", "Save"]);
  });

  it("drops cases that are still invalid and counts them", () => {
    const { cases, dropped } = normalizeDrafts([draft(), draft({ steps: [] }), draft({ expected: "  " })], []);
    expect(cases).toHaveLength(1);
    expect(dropped).toBe(2);
  });

  it("clips long fields instead of failing", () => {
    const { cases } = normalizeDrafts([draft({ title: "x".repeat(500) })], []);
    expect(cases[0].title).toHaveLength(200);
    expect(testCaseInput.safeParse(cases[0]).success).toBe(true);
  });

  it("normalizes tags and dedupes open questions", () => {
    const { cases, openQuestions } = normalizeDrafts([draft({ tags: ["Critical", "@made-up"], openQuestions: ["Q?", "Q?"] })], ["A?", "A?", " "]);
    expect(cases[0].tags).toEqual(["@critical"]);
    expect(cases[0].openQuestions).toEqual(["Q?"]);
    expect(openQuestions).toEqual(["A?"]);
  });
});
