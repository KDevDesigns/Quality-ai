import { describe, expect, it } from "vitest";
import { areaLabel, buildCells, dayEntries, daysAttended, defaultEntry, fillDefaults, fitCells, NO_ENTRY, prefixFor, refillCells, REST_DAY } from "@/lib/dar/autofill";
import { easter, holidayOn, isDayOff } from "@/lib/dar/holidays";
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
import { adoptLegacyTemplate, isEmptySetup, LEGACY_TEMPLATE, nameInitials, resolveHeader, type DarProfileRow } from "@/lib/dar/template";

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
    // The 3rd and 18th start the other period days (3rd–17th / 18th–2nd); other days start nothing.
    expect(parsePeriod("2026-10-03")).toEqual({ start: "2026-10-03", end: "2026-10-17" });
    expect(parsePeriod("2026-10-05")).toBeNull();
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
    // A third level with no code of its own takes the nearest code above it.
    expect(areaLabel({ name: "Approval", code: null, parent: { name: "Purchase Requisition", code: null, parent: { name: "Procurement", code: "PROC" } } })).toBe("PROC");
    expect(areaLabel({ name: "Approval", code: null, parent: { name: "Purchase Requisition", code: "PR", parent: { name: "Procurement", code: "PROC" } } })).toBe("PR");
  });

  it("writes each day's modules once, in order; otherwise REST DAY on weekends and \"-\" on work days", () => {
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
    // Oct 1–15, 2026: Oct 3, 4, 10 and 11 are the weekend; Oct 1, 2 and 5 had activity.
    expect(entries.filter((e) => e === REST_DAY)).toHaveLength(4);
    expect(entries.filter((e) => e === NO_ENTRY)).toHaveLength(8);
    expect(entries[5]).toBe(NO_ENTRY); // Tuesday Oct 6
  });

  it("knows weekends and Philippine holidays, Holy Week included", () => {
    expect(easter(2026)).toBe("2026-04-05");
    expect(easter(2027)).toBe("2027-03-28");
    expect(holidayOn("2026-04-02")).toBe("Maundy Thursday");
    expect(holidayOn("2026-04-03")).toBe("Good Friday");
    expect(holidayOn("2026-08-31")).toBe("National Heroes Day"); // the last Monday of August 2026
    expect(holidayOn("2026-03-16")).toBe("Araw ng Dabaw");
    expect(holidayOn("2026-12-25")).toBe("Christmas Day");
    expect(holidayOn("2026-10-06")).toBeNull();
    expect(isDayOff("2026-10-03")).toBe(true); // Saturday
    expect(isDayOff("2026-11-30")).toBe(true); // Monday, Bonifacio Day
    expect(isDayOff("2026-10-06")).toBe(false);
    expect(defaultEntry({ date: "2026-11-01" })).toBe(REST_DAY);
    expect(defaultEntry({ date: "2026-11-03" })).toBe(NO_ENTRY);
  });

  it("fills an import's blank days with the defaults, keeping what was written", () => {
    const d = [{ date: "2026-10-02" }, { date: "2026-10-03" }, { date: "2026-10-05" }];
    expect(fillDefaults({ core: [["", " ", "Tested BCA"]], support: [] }, d)).toEqual({ core: [[NO_ENTRY, REST_DAY, "Tested BCA"]], support: [] });
  });

  it("counts a late-evening action on the Manila day", () => {
    // 23:30 Manila on Oct 3 is 15:30 UTC the same day; 00:30 Manila on Oct 4 is 16:30 UTC on Oct 3.
    const e = dayEntries([{ at: new Date("2026-10-03T16:30:00Z"), area: bca }], days);
    expect(e[2]).toBe(REST_DAY);
    expect(e[3]).toBe("QA - BCA");
  });

  it("starts developers' days with DEV", () => {
    expect(prefixFor("DEV")).toBe("DEV");
    expect(prefixFor("QA")).toBe("QA");
    expect(prefixFor("ADMIN")).toBe("QA");
    expect(dayEntries([{ at: at(1), area: bca }, { at: at(2), area: null }], days, "DEV").slice(0, 2)).toEqual(["DEV - BCA", "DEV"]);
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
    // A dash means nothing was done.
    expect(daysAttended({ core: [["-", " – ", "Tested"]], support: [] })).toBe(1);
  });

  it("starts the other rows with each day's default", () => {
    const d = periodDays({ start: "2026-10-01", end: "2026-10-04" });
    expect(buildCells(fns, ["QA - BCA", NO_ENTRY, REST_DAY, REST_DAY], d).support[0]).toEqual([NO_ENTRY, NO_ENTRY, REST_DAY, REST_DAY]);
  });

  it("fits saved cells to the current rows and days, and refills only auto-fill rows", () => {
    const fresh = buildCells(fns, ["A", "B"]);
    expect(fitCells({ core: [["x", 5, "extra"]], support: "junk" }, fresh)).toEqual({ core: [["x", ""]], support: fresh.support });
    expect(fitCells(null, fresh)).toEqual(fresh);
    const typed = { core: [["mine", "mine"]], support: [["kept", "kept"], ["old", "old"]] };
    expect(refillCells(typed, fresh, fns)).toEqual({ core: [["A", "B"]], support: [["kept", "kept"], ["A", "B"]] });
  });
});

const profile = (p: Partial<NonNullable<DarProfileRow>> = {}): NonNullable<DarProfileRow> => ({
  fullName: null,
  position: null,
  department: null,
  unit: null,
  confirmedByName: null,
  confirmedByTitle: null,
  notedByName: null,
  notedByTitle: null,
  coreFunctions: null,
  supportFunctions: null,
  ...p,
});

describe("DAR details", () => {
  it("starts everyone empty, apart from the account name", () => {
    const h = resolveHeader(null, { name: "Rj" });
    expect(h).toEqual({
      name: "Rj",
      position: "",
      department: "",
      unit: "",
      supervisor: "",
      confirmedBy: { name: "", title: "" },
      notedBy: { name: "", title: "" },
      core: [],
      support: [],
    });
    expect(isEmptySetup(h)).toBe(true);
  });

  it("shows the person's own details, and ignores a bad stored list", () => {
    const mine = [{ duty: "My duty", mfo: "Mine", autofill: true }];
    const h = resolveHeader(
      profile({ fullName: "Reuben John F. Lisondra", position: " Developer ", unit: "Systems Unit", confirmedByName: "Boss", confirmedByTitle: "OIC", coreFunctions: mine, supportFunctions: "bad" }),
      { name: "Rj" },
    );
    expect(h).toMatchObject({ name: "Reuben John F. Lisondra", position: "Developer", unit: "Systems Unit", supervisor: "Boss", confirmedBy: { name: "Boss", title: "OIC" }, core: mine, support: [] });
    expect(isEmptySetup(h)).toBe(false);
  });

  it("gives an old backup's DAR users the old template, keeping what they had set", () => {
    const own = [{ duty: "Own", mfo: "", autofill: false }];
    const row = adoptLegacyTemplate({ userId: "u1", ...profile({ fullName: "Ana", position: "Tester", coreFunctions: own }) }, { unit: "QA Unit" });
    expect(row).toMatchObject({ userId: "u1", fullName: "Ana", position: "Tester", unit: "QA Unit", department: LEGACY_TEMPLATE.department, confirmedByName: LEGACY_TEMPLATE.confirmedBy.name });
    expect(row.coreFunctions).toEqual(own);
    expect(row.supportFunctions).toEqual(LEGACY_TEMPLATE.supportFunctions);
    // No stored template, or a broken one: the built-in values.
    expect(adoptLegacyTemplate({ userId: "u2" }, undefined)).toMatchObject({ position: LEGACY_TEMPLATE.position, coreFunctions: LEGACY_TEMPLATE.coreFunctions });
    expect(adoptLegacyTemplate({ userId: "u3" }, { unit: 5 })).toMatchObject({ unit: LEGACY_TEMPLATE.unit });
  });

  it("makes file-name initials", () => {
    expect(nameInitials("Reuben John F. Lisondra")).toBe("RJFL");
    expect(nameInitials("  ana  dela cruz ")).toBe("ADC");
  });
});

describe("darHtml", () => {
  it("merges a duty's number and cell down its MFO rows", () => {
    const period = { start: "2026-10-18", end: "2026-11-02" };
    const days = periodDays(period);
    const coreFunctions = [
      { duty: "Design ERP screens", mfo: "Billing UI", autofill: false },
      { duty: "", mfo: "HRM UI", autofill: false, continues: true },
      { duty: "QA testing", mfo: "Reports", autofill: false },
    ];
    const header = resolveHeader(profile({ coreFunctions }), { name: "x" });
    const r: DarReportData = { period, days, header, cells: buildCells(header, days.map(() => "")), dateSubmitted: "2026-11-04", daysAttended: 0, saved: false };
    const html = darHtml(r);
    expect(html).toContain('<td class="n" rowspan="2">1</td><td class="duty" rowspan="2">Design ERP screens</td><td class="mfo">Billing UI</td>');
    expect(html).toContain('<tr><td class="mfo">HRM UI</td>');
    expect(html).toContain('<td class="n">2</td><td class="duty">QA testing</td>');
    expect(html).toContain("Oct 18, 2026 to Nov 02, 2026");
  });

  it("escapes everything typed", () => {
    const period = { start: "2026-10-01", end: "2026-10-15" };
    const days = periodDays(period);
    const header = resolveHeader(profile({ fullName: "<b>Ana</b>", coreFunctions: LEGACY_TEMPLATE.coreFunctions }), { name: "x" });
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
