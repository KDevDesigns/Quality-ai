import { describe, expect, it } from "vitest";
import { firstPeriodOf, monthLabel, monthOptions, nextPeriod, parsePeriod, periodsFrom, type Period } from "@/lib/dar/period";
import { darProfileInput } from "@/lib/dar/template";

const p = (start: string) => parsePeriod(start) as Period;
const starts = (list: Period[]) => list.map((x) => x.start);

describe("nextPeriod", () => {
  it("goes from the 1st to the 16th, and from the 16th to next month", () => {
    expect(nextPeriod(p("2026-11-01"))).toEqual({ start: "2026-11-16", end: "2026-11-30" });
    expect(nextPeriod(p("2026-11-16"))).toEqual({ start: "2026-12-01", end: "2026-12-15" });
    expect(nextPeriod(p("2026-12-16"))).toEqual({ start: "2027-01-01", end: "2027-01-15" });
  });
});

describe("periodsFrom", () => {
  it("lists from the first period to the current one, newest first", () => {
    expect(starts(periodsFrom(p("2026-10-01"), "2026-12-20"))).toEqual(["2026-12-16", "2026-12-01", "2026-11-16", "2026-11-01", "2026-10-16", "2026-10-01"]);
  });

  it("always includes both halves of the first month", () => {
    expect(starts(periodsFrom(p("2026-11-01"), "2026-11-03"))).toEqual(["2026-11-16", "2026-11-01"]);
  });

  it("starting on a 2nd half, it doesn't list the 1st half before it", () => {
    expect(starts(periodsFrom(p("2026-11-16"), "2026-11-20"))).toEqual(["2026-11-16"]);
  });

  it("works when the first period is still to come", () => {
    expect(starts(periodsFrom(p("2027-01-01"), "2026-11-03"))).toEqual(["2027-01-16", "2027-01-01"]);
  });

  it("stops at a sane length for a bad old date", () => {
    expect(periodsFrom(p("1900-01-01"), "2026-11-03").length).toBe(240);
  });
});

describe("firstPeriodOf", () => {
  it("prefers the chosen period, then the earliest saved, then nothing", () => {
    expect(firstPeriodOf("2026-11-16", ["2026-01-01"])?.start).toBe("2026-11-16");
    expect(firstPeriodOf(null, ["2026-03-16", "2026-01-01"])?.start).toBe("2026-01-01");
    expect(firstPeriodOf(null, [])).toBeNull();
  });
});

describe("monthOptions", () => {
  it("offers the next two months and the last year, newest first", () => {
    const m = monthOptions("2026-11-03");
    expect(m[0]).toBe("2027-01");
    expect(m).toContain("2026-11");
    expect(m.at(-1)).toBe("2025-11");
  });

  it("keeps an older month that is already chosen", () => {
    expect(monthOptions("2026-11-03", "2024-02").at(-1)).toBe("2024-02");
  });

  it("names a month", () => {
    expect(monthLabel("2026-11")).toBe("November 2026");
  });
});

describe("darProfileInput firstPeriodStart", () => {
  const base = { fullName: "", position: "", department: "", unit: "", confirmedBy: {}, notedBy: {}, coreFunctions: [], supportFunctions: [] };

  it("takes the 1st or 16th of a real month, or nothing", () => {
    expect(darProfileInput.safeParse({ ...base, firstPeriodStart: "2026-11-16" }).success).toBe(true);
    expect(darProfileInput.safeParse({ ...base, firstPeriodStart: "" }).success).toBe(true);
    expect(darProfileInput.safeParse(base).success).toBe(true);
  });

  it("refuses any other date", () => {
    expect(darProfileInput.safeParse({ ...base, firstPeriodStart: "2026-11-05" }).success).toBe(false);
    expect(darProfileInput.safeParse({ ...base, firstPeriodStart: "2026-13-01" }).success).toBe(false);
  });
});
