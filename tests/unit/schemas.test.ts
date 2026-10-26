import { describe, expect, it } from "vitest";
import { environmentInput, readBaseUrls } from "@/lib/schemas/environment";
import { processInput, readSteps } from "@/lib/schemas/process";
import { riskInput } from "@/lib/schemas/risk";

const env = {
  projectId: "p1",
  name: "staging",
  baseUrls: ["https://erp-staging.example.local"],
  apiBaseUrl: "",
  dbConnRef: "",
  isProduction: false,
  notes: "",
};

describe("environmentInput", () => {
  it("accepts a valid staging env and normalizes blanks to null", () => {
    const r = environmentInput.parse(env);
    expect(r.apiBaseUrl).toBeNull();
    expect(r.dbConnRef).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("dedupes base URLs after normalizing case and trailing slashes", () => {
    const r = environmentInput.parse({
      ...env,
      baseUrls: ["https://ERP-staging.example.local/", "https://erp-staging.example.local", "https://x.local/erp/"],
    });
    expect(r.baseUrls).toEqual(["https://erp-staging.example.local", "https://x.local/erp"]);
  });

  it.each([
    ["no base URLs", { baseUrls: [] }],
    ["non-absolute base", { baseUrls: ["erp-staging.example.local"] }],
    ["credentials in base", { baseUrls: ["https://u:p@erp.local"] }],
    ["bad apiBaseUrl", { apiBaseUrl: "ftp://api.local" }],
    ["connection string instead of env var name", { dbConnRef: "mysql://ro:secret@db/erp" }],
    ["blank name", { name: "  " }],
  ])("rejects %s", (_l, patch) => {
    expect(environmentInput.safeParse({ ...env, ...patch }).success).toBe(false);
  });

  it("readBaseUrls tolerates malformed JSON", () => {
    expect(readBaseUrls(["a"])).toEqual(["a"]);
    expect(readBaseUrls("nope")).toEqual([]);
    expect(readBaseUrls(null)).toEqual([]);
  });
});

describe("riskInput", () => {
  const risk = { moduleId: "m1", title: "Tariff boundary", characteristic: "Functional suitability", likelihood: "4", impact: "5" };

  it("coerces form strings to ints", () => {
    const r = riskInput.parse(risk);
    expect(r.likelihood).toBe(4);
    expect(r.impact).toBe(5);
    expect(r.processId).toBeNull();
  });

  it.each([
    ["likelihood 0", { likelihood: "0" }],
    ["impact 6", { impact: "6" }],
    ["fractional", { impact: "2.5" }],
    ["unknown characteristic", { characteristic: "Usability" }],
    ["missing title", { title: "" }],
  ])("rejects %s", (_l, patch) => {
    expect(riskInput.safeParse({ ...risk, ...patch }).success).toBe(false);
  });
});

describe("processInput", () => {
  it("numbers steps in submitted order", () => {
    const r = processInput.parse({
      moduleId: "m1",
      name: "Meter-to-Cash",
      steps: [{ name: "Reading" }, { name: "Bill run", module: "BILLING", handoff: true }],
    });
    expect(r.steps.map((s) => [s.order, s.name])).toEqual([[1, "Reading"], [2, "Bill run"]]);
    expect(r.steps[0]).toMatchObject({ module: null, handoff: false });
  });

  it("requires at least one step", () => {
    expect(processInput.safeParse({ moduleId: "m1", name: "x", steps: [] }).success).toBe(false);
  });

  it("readSteps sorts by order and rejects malformed data", () => {
    expect(readSteps([{ order: 2, name: "b", module: null, handoff: false }, { order: 1, name: "a", module: null, handoff: false }]).map((s) => s.name)).toEqual(["a", "b"]);
    expect(readSteps({})).toEqual([]);
  });
});
