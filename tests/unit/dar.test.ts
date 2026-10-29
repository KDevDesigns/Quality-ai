import { describe, expect, it } from "vitest";
import { areaLabel, buildCells, dayEntries, daysAttended, fitCells, refillCells, REST_DAY } from "@/lib/dar/autofill";
import { darHtml } from "@/lib/dar/html";
import {
  longDate,
  manilaDay,
  parsePeriod,
  periodDays,
  periodFileLabel,
  periodFor,
  periodLabel,
  periodRange,
  previousPeriod,
  recentPeriods,
} from "@/lib/dar/period";
import type { DarReportData } from "@/lib/dar/store";
import { nameInitials, readDarTemplate, resolveHeader } from "@/lib/dar/template";

describe("DAR periods", () => {
  it("splits each month at the 15th", () => {
    expect(periodFor("2026-10-15")).toEqual({ start: "2026-10-01", end: "2026-10-15" });
    expect(periodFor("2026-10-16")).toEqual({ start: "2026-10-16", end: "2026-10-31" });
    expect(periodFor("2026-11-30")).toEqual({ start: "2026-11-16", end: "2026-11-30" });
    expect(periodFor("2026-02-20")).toEqual({ start: "2026-02-16", end: "2026-02-28" });
    expect(periodFor("2028-02-20")).toEqual({ start: "2028-02-16", end: "2028-02-29" });
  });

  it("uses Manila dates, not the server's", () => {
    // 16:30 UTC on Oct 15 is already 00:30 on Oct 16 in Manila.
    expect(manilaDay(new Date("2026-10-15T16:30:00Z"))).toBe("2026-10-16");
    expect(periodFor(new Date("2026-10-15T16:30:00Z")).start).toBe("2026-10-16");
    const r = periodRange({ start: "2026-10-16", end: "2026-10-31" });
    expect(r.from.toISOString()).toBe("2026-10-15T16:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-31T16:00:00.000Z");
    expect(periodRange({ start: "2026-12-16", end: "2026-12-31" }).to.toISOString()).toBe("2026-12-31T16:00:00.000Z");
  });

  it("accepts only real period starts", () => {
    expect(parsePeriod("2026-10-16")).toEqual({ start: "2026-10-16", end: "2026-10-31" });
    expect(parsePeriod("2026-10-03")).toBeNull();
    expect(parsePeriod("2026-13-01")).toBeNull();
    expect(parsePeriod("../etc")).toBeNull();
  });

  it("steps back across months and years", () => {
    expect(previousPeriod({ start: "2026-10-16", end: "2026-10-31" }).start).toBe("2026-10-01");
    expect(previousPeriod({ start: "2026-01-01", end: "2026-01-15" })).toEqual({ start: "2025-12-16", end: "2025-12-31" });
    expect(recentPeriods("2026-10-29", 3).map((p) => p.start)).toEqual(["2026-10-16", "2026-10-01", "2026-09-16"]);
  });

  it("lists the days with their weekday, and formats labels like the form", () => {
    const days = periodDays({ start: "2026-10-16", end: "2026-10-31" });
    expect(days).toHaveLength(16);
    expect(days[0]).toEqual({ date: "2026-10-16", month: "OCT", day: 16, dow: "FRI" });
    expect(days[2].dow).toBe("SUN");
    expect(periodLabel({ start: "2026-10-01", end: "2026-10-15" })).toBe("Oct 01, 2026 to Oct 15, 2026");
    expect(periodFileLabel({ start: "2026-10-16", end: "2026-10-31" })).toBe("Oct16-Oct31 2026");
    expect(longDate("2026-10-22")).toBe("October 22, 2026");
  });
});

describe("DAR auto-fill", () => {
  const days = periodDays({ start: "2026-10-01", end: "2026-10-15" });
  const bca = { name: "Billing & Collection", code: "BCA", parent: null };
  const crm = { name: "Customer Relations", code: "CRM", parent: null };
  const rsp = { name: "Recruitment", code: null, parent: { name: "HR", code: "HR-RSP" } };
  const noCode = { name: "Payroll", code: null, parent: { name: "HR", code: null } };
  const at = (day: number, hour = 9) => new Date(Date.UTC(2026, 9, day, hour - 8)); // Manila hour

  it("labels a module by its code, its module's code, then its name", () => {
    expect(areaLabel(bca)).toBe("BCA");
    expect(areaLabel(rsp)).toBe("HR-RSP");
    expect(areaLabel(noCode)).toBe("Payroll");
  });

  it("writes each day's modules once, in order, and rest days where nothing happened", () => {
    const entries = dayEntries(
      [
        { at: at(1, 9), area: bca },
        { at: at(1, 10), area: crm },
        { at: at(1, 11), area: bca },
        { at: at(2), area: null },
        { at: at(5, 8), area: rsp },
        { at: at(5, 7), area: crm },
      ],
      days,
    );
    expect(entries[0]).toBe("QA - BCA / CRM");
    expect(entries[1]).toBe("QA");
    expect(entries[2]).toBe(REST_DAY);
    expect(entries[4]).toBe("QA - CRM / HR-RSP");
    expect(entries.filter((e) => e === REST_DAY)).toHaveLength(12);
  });

  it("counts a late-evening action on the Manila day", () => {
    // 23:30 Manila on Oct 3 is 15:30 UTC the same day; 00:30 Manila on Oct 4 is 16:30 UTC on Oct 3.
    const e = dayEntries([{ at: new Date("2026-10-03T16:30:00Z"), area: bca }], days);
    expect(e[2]).toBe(REST_DAY);
    expect(e[3]).toBe("QA - BCA");
  });

  const fns = {
    core: [{ duty: "Test", mfo: "", autofill: true }],
    support: [
      { duty: "Encode", mfo: "", autofill: false },
      { duty: "Review", mfo: "", autofill: true },
    ],
  };

  it("fills only the auto-fill rows and counts days attended", () => {
    const cells = buildCells(fns, ["QA - BCA", REST_DAY, "QA"]);
    expect(cells).toEqual({ core: [["QA - BCA", REST_DAY, "QA"]], support: [["", "", ""], ["QA - BCA", REST_DAY, "QA"]] });
    expect(daysAttended(cells)).toBe(2);
    cells.support[0][1] = "HR201";
    expect(daysAttended(cells)).toBe(3);
    expect(daysAttended({ core: [["rest day", " Rest Day "]], support: [] })).toBe(0);
  });

  it("fits saved cells to the current rows and days, and refills only auto-fill rows", () => {
    const fresh = buildCells(fns, ["A", "B"]);
    expect(fitCells({ core: [["x", 5, "extra"]], support: "junk" }, fresh)).toEqual({ core: [["x", ""]], support: fresh.support });
    expect(fitCells(null, fresh)).toEqual(fresh);
    const typed = { core: [["mine", "mine"]], support: [["kept", "kept"], ["old", "old"]] };
    expect(refillCells(typed, fresh, fns)).toEqual({ core: [["A", "B"]], support: [["kept", "kept"], ["A", "B"]] });
  });
});

describe("DAR template", () => {
  it("has working defaults and survives bad stored JSON", () => {
    const t = readDarTemplate(undefined);
    expect(t.position).toBe("System Analyst");
    expect(t.coreFunctions[0].autofill).toBe(true);
    expect(t.supportFunctions.map((f) => f.autofill)).toEqual([false, true, false]);
    expect(readDarTemplate("garbage")).toEqual(t);
    expect(readDarTemplate({ unit: "QA Unit" }).unit).toBe("QA Unit");
  });

  it("puts the tester's own details over the template", () => {
    const t = readDarTemplate({});
    expect(resolveHeader(t, null, { name: "Rj" })).toMatchObject({ name: "Rj", position: "System Analyst", supervisor: t.confirmedBy.name });
    const mine = [{ duty: "My duty", mfo: "Mine", autofill: true }];
    const h = resolveHeader(t, { fullName: "Reuben John F. Lisondra", position: " ", coreFunctions: mine, supportFunctions: "bad" }, { name: "Rj" });
    expect(h).toMatchObject({ name: "Reuben John F. Lisondra", position: "System Analyst", core: mine, support: t.supportFunctions });
  });

  it("makes file-name initials", () => {
    expect(nameInitials("Reuben John F. Lisondra")).toBe("RJFL");
    expect(nameInitials("  ana  dela cruz ")).toBe("ADC");
  });
});

describe("darHtml", () => {
  it("escapes everything typed", () => {
    const t = readDarTemplate({});
    const period = { start: "2026-10-01", end: "2026-10-15" };
    const days = periodDays(period);
    const header = resolveHeader(t, { fullName: "<b>Ana</b>", position: null, coreFunctions: null, supportFunctions: null }, { name: "x" });
    const cells = buildCells(header, days.map(() => REST_DAY));
    cells.core[0][0] = `<script>alert(1)</script>`;
    const r: DarReportData = { period, days, header, cells, dateSubmitted: "2026-10-16", daysAttended: 1, saved: false };
    const html = darHtml(r, { seal: `"><script>` });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(html).toContain("Oct 01, 2026 to Oct 15, 2026");
    expect(html).toContain("October 16, 2026");
    expect(html).toContain("1 Days");
    // Long bond paper and the DCWD workbook's colours.
    expect(html).toContain("size: 13in 8.5in");
    expect(html).toContain("print-color-adjust: exact"); // keep the fills when printing
    // No room for the browser's own headers and footers; the margin is even padding instead.
    expect(html).toContain("margin: 0; }");
    expect(html).toContain("padding: 0.5in");
    expect(html).toContain("background: #ffcc99");
    expect(html).toContain('<th class="core" colspan="2">A.) CORE FUNCTIONS</th>');
    expect(html).toContain("background: #fbd4b4");
    expect(html).toContain("color: #808000");
  });
});
