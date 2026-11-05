import { describe, expect, it } from "vitest";
import { filterUsers, userStatus, type FilterableUser } from "@/lib/users/filter";

const u = (over: Partial<FilterableUser>): FilterableUser => ({ name: "Ana", email: "ana@davao-water.gov.ph", role: "QA", active: true, mustChangePassword: false, modules: [], ...over });
const people = [
  u({ name: "Ana", modules: ["Billing"] }),
  u({ name: "Ben", email: "ben@davao-water.gov.ph", role: "DEV", mustChangePassword: true, modules: ["Billing", "Payroll"] }),
  u({ name: "Cy", email: "cy@davao-water.gov.ph", role: "DEV", active: false }),
];
const names = (f: Partial<{ q: string; role: string; module: string; status: string }>) =>
  filterUsers(people, { q: "", role: "", module: "", status: "", ...f }).map((p) => p.name);

describe("filterUsers", () => {
  it("keeps everyone with no filter", () => {
    expect(names({})).toEqual(["Ana", "Ben", "Cy"]);
  });

  it("searches the nickname and email, ignoring case", () => {
    expect(names({ q: "BEN" })).toEqual(["Ben"]);
    expect(names({ q: "cy@" })).toEqual(["Cy"]);
  });

  it("filters by role, module (or no module) and status", () => {
    expect(names({ role: "DEV" })).toEqual(["Ben", "Cy"]);
    expect(names({ module: "Payroll" })).toEqual(["Ben"]);
    expect(names({ module: "none" })).toEqual(["Cy"]);
    expect(names({ status: "temp" })).toEqual(["Ben"]);
    expect(names({ status: "off" })).toEqual(["Cy"]);
    expect(names({ role: "DEV", module: "Billing", status: "active" })).toEqual([]);
  });
});

describe("userStatus", () => {
  it("puts turned off before a temporary password", () => {
    expect(userStatus({ active: false, mustChangePassword: true })).toBe("off");
    expect(userStatus({ active: true, mustChangePassword: true })).toBe("temp");
    expect(userStatus({ active: true, mustChangePassword: false })).toBe("active");
  });
});
