import { describe, expect, it } from "vitest";
import { matchesModule, pickModule, type DirectoryModule } from "@/lib/areas/directory";

const billing: DirectoryModule = { id: "b", name: "Billing & Collection", code: "BCA", children: [{ name: "Meter Reading", code: "BCA-MR" }] };
const payroll: DirectoryModule = { id: "p", name: "Payroll", code: null, children: [] };

describe("matchesModule", () => {
  it("keeps everything for an empty search", () => {
    expect(matchesModule(billing, "")).toBe(true);
    expect(matchesModule(payroll, "   ")).toBe(true);
  });

  it("matches the name or code, ignoring case", () => {
    expect(matchesModule(billing, "billing")).toBe(true);
    expect(matchesModule(billing, "bca")).toBe(true);
    expect(matchesModule(payroll, "bca")).toBe(false);
  });

  it("matches a sub-module's name or code, so searching a sub-module finds its module", () => {
    expect(matchesModule(billing, "meter")).toBe(true);
    expect(matchesModule(billing, "-mr")).toBe(true);
  });
});

describe("pickModule", () => {
  it("opens the module in the address when it is in the list, otherwise the first", () => {
    expect(pickModule([billing, payroll], "p")?.id).toBe("p");
    expect(pickModule([billing, payroll], "gone")?.id).toBe("b");
    expect(pickModule([billing, payroll], null)?.id).toBe("b");
  });

  it("opens nothing for an empty list", () => {
    expect(pickModule([], "b")).toBeNull();
  });
});
