import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { columnIndex, detectScheme, excelDate, parseDarWorkbook, readWorkbook, DarImportError } from "@/lib/dar/import";
import {
  firstPeriodOf,
  isFirstHalf,
  monthPeriods,
  nextPeriod,
  parsePeriod,
  periodDays,
  periodFor,
  periodsFrom,
  previousPeriod,
  recentPeriods,
  schemeOf,
  schemeOfStart,
} from "@/lib/dar/period";
import { darProfileInput, dutyLayout, type DarFunction } from "@/lib/dar/template";

// ---------------------------------------------------------------------------------------------------------------------
// A tiny .xlsx built in the test: one sheet per entry, cells given as { "B7": "text" | number }.

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const colOf = (ref: string) => /^[A-Z]+/.exec(ref)![0];
const rowOf = (ref: string) => Number(/\d+$/.exec(ref)![0]);

function xlsx(sheets: { name: string; cells: Record<string, string | number> }[]): Uint8Array {
  const shared: string[] = [];
  const files: Record<string, Uint8Array> = {};
  sheets.forEach((sh, i) => {
    const rows = new Map<number, string[]>();
    for (const [ref, v] of Object.entries(sh.cells).sort((a, b) => rowOf(a[0]) - rowOf(b[0]) || columnIndex(colOf(a[0])) - columnIndex(colOf(b[0])))) {
      const cell = typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="s"><v>${shared.push(v) - 1}</v></c>`;
      rows.set(rowOf(ref), [...(rows.get(rowOf(ref)) ?? []), cell]);
    }
    const body = [...rows.entries()].map(([r, cs]) => `<row r="${r}">${cs.join("")}</row>`).join("");
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<?xml version="1.0"?><worksheet><sheetData>${body}</sheetData></worksheet>`);
  });
  files["xl/workbook.xml"] = strToU8(
    `<workbook><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
  );
  files["xl/_rels/workbook.xml.rels"] = strToU8(
    `<Relationships>${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
  );
  files["xl/sharedStrings.xml"] = strToU8(`<sst>${shared.map((s) => `<si><t xml:space="preserve">${xmlEsc(s)}</t></si>`).join("")}</sst>`);
  return zipSync(files);
}

const serial = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000) + 25569;
const COLS = "NOPQRSTUVWXYZ".split("").concat(["AA", "AB", "AC"]);

/** The DCWD form as in the example workbook: labels in column B, days from column N, one duty with two MFOs. */
function darSheet(first: string, days: number, entries: Record<string, Record<number, string>>, extraMfo?: string) {
  const c: Record<string, string | number> = {
    B7: "Name of JOE                     :",
    E7: "Juan D. Dela Cruz",
    W7: "     Date Submitted : ",
    AA7: serial("2026-10-22"),
    B8: "Position Title                   :",
    E8: "Information System Designer",
    B9: "Department                     :",
    E9: "ICT Department",
    B10: "Unit                                     :",
    E10: "Data Management Unit",
    B11: "Immediate Supervisor ",
    E11: "Maria S. Santos",
    B17: "A.) CORE FUNCTIONS",
    H17: "MAJOR FINAL OUTPUT (MFOs)",
    C19: "1.0",
    D19: "Perform project mock-up designs",
    H19: "Design UI of ERP Billing",
    H20: "Design UI of ERP HRM",
    C21: "2.0",
    D21: "Conduct QA testing",
    H21: "Reports tested",
    B25: "B;) SUPPORT FUNCTIONS",
    H25: "MAJOR FINAL OUTPUT (MFOs)",
    C27: "1.0",
    D27: "Attendance to meetings",
    H27: "Meetings attended",
    C34: "Prepared by:",
    H34: "Reviewed by:",
    P34: "Approved by:",
    C38: "JUAN D. DELA CRUZ",
    H38: "MARIA S. SANTOS",
    P38: "ENGR. PEDRO REYES",
    C39: "Information System Designer",
    H39: "OIC, Data Management Unit",
    P39: "Department Manager",
  };
  if (extraMfo) Object.assign(c, { H20: extraMfo });
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.parse(`${first}T00:00:00Z`) + i * 86_400_000);
    c[`${COLS[i]}17`] = serial(d.toISOString().slice(0, 10));
    c[`${COLS[i]}18`] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getUTCDay()];
    c[`${COLS[i]}26`] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getUTCDay()];
    for (const row of [19, 20, 21, 27]) c[`${COLS[i]}${row}`] = entries[row]?.[i] ?? "-";
  }
  return c;
}

describe("DAR period days", () => {
  it("has 3rd–17th and 18th–2nd periods next to the 1st–15th and 16th–end", () => {
    expect(periodFor("2026-10-05", "3-18")).toEqual({ start: "2026-10-03", end: "2026-10-17" });
    expect(periodFor("2026-10-25", "3-18")).toEqual({ start: "2026-10-18", end: "2026-11-02" });
    expect(periodFor("2026-11-02", "3-18")).toEqual({ start: "2026-10-18", end: "2026-11-02" });
    expect(periodFor("2026-01-01", "3-18")).toEqual({ start: "2025-12-18", end: "2026-01-02" });
    expect(periodFor("2026-02-20", "1-16")).toEqual({ start: "2026-02-16", end: "2026-02-28" });
    expect(parsePeriod("2026-10-18")).toEqual({ start: "2026-10-18", end: "2026-11-02" });
    expect(schemeOfStart("2026-10-18")).toBe("3-18");
    expect(schemeOfStart("2026-10-16")).toBe("1-16");
    expect(schemeOf("weird")).toBe("1-16");
  });

  it("steps through periods, lists days across a month end, and keeps the scheme", () => {
    const p = { start: "2026-10-18", end: "2026-11-02" };
    expect(nextPeriod(p)).toEqual({ start: "2026-11-03", end: "2026-11-17" });
    expect(previousPeriod(p)).toEqual({ start: "2026-10-03", end: "2026-10-17" });
    expect(previousPeriod({ start: "2026-01-03", end: "2026-01-17" })).toEqual({ start: "2025-12-18", end: "2026-01-02" });
    const days = periodDays(p);
    expect(days).toHaveLength(16);
    expect(days.at(-1)).toMatchObject({ date: "2026-11-02", month: "NOV", day: 2, dow: "MON" });
    expect(isFirstHalf({ start: "2026-10-03", end: "2026-10-17" })).toBe(true);
    expect(isFirstHalf(p)).toBe(false);
    expect(monthPeriods("2026-10", "3-18").map((x) => x.start)).toEqual(["2026-10-03", "2026-10-18"]);
    expect(recentPeriods("2026-11-01", 2, "3-18").map((x) => x.start)).toEqual(["2026-10-18", "2026-10-03"]);
    expect(periodsFrom({ start: "2026-10-03", end: "2026-10-17" }, "2026-11-10").map((x) => x.start)).toEqual(["2026-11-03", "2026-10-18", "2026-10-03"]);
    // Switching scheme moves the first period to the one covering the same date.
    expect(firstPeriodOf("2026-11-01", [], "3-18")).toEqual({ start: "2026-10-18", end: "2026-11-02" });
  });

  it("checks the first period matches the chosen period days", () => {
    const base = { fullName: "", position: "", department: "", unit: "", confirmedBy: {}, notedBy: {}, coreFunctions: [], supportFunctions: [] };
    expect(darProfileInput.safeParse({ ...base, periodScheme: "3-18", firstPeriodStart: "2026-10-18" }).success).toBe(true);
    expect(darProfileInput.safeParse({ ...base, periodScheme: "3-18", firstPeriodStart: "2026-10-16" }).success).toBe(false);
    expect(darProfileInput.safeParse({ ...base, firstPeriodStart: "2026-10-16" }).success).toBe(true);
  });
});

describe("duties with several MFOs", () => {
  it("numbers duties and spans a duty over its MFO rows", () => {
    const f = (duty: string, continues = false): DarFunction => ({ duty, mfo: "m", autofill: false, continues });
    expect(dutyLayout([f("A"), f("", true), f("", true), f("B"), f("C"), f("", true)])).toEqual([
      { number: 1, span: 3 },
      { number: 1, span: 0 },
      { number: 1, span: 0 },
      { number: 2, span: 1 },
      { number: 3, span: 2 },
      { number: 3, span: 0 },
    ]);
  });

  it("lets a continuing row leave the duty empty, but not the first row", () => {
    const base = { fullName: "", position: "", department: "", unit: "", confirmedBy: {}, notedBy: {}, supportFunctions: [] };
    const ok = darProfileInput.parse({ ...base, coreFunctions: [{ duty: "A", mfo: "1" }, { duty: "stale", mfo: "2", continues: true }] });
    expect(ok.coreFunctions[1]).toMatchObject({ duty: "", mfo: "2", continues: true });
    expect(darProfileInput.safeParse({ ...base, coreFunctions: [{ duty: "", mfo: "1", continues: true }] }).success).toBe(false);
    expect(darProfileInput.safeParse({ ...base, coreFunctions: [{ duty: "A" }, { duty: "", mfo: "2" }] }).success).toBe(false);
  });
});

describe("DAR Excel import", () => {
  it("reads cells, shared strings and dates", () => {
    const [sheet] = readWorkbook(xlsx([{ name: "S & 1", cells: { A1: "Hi & bye", B2: 46313 } }]));
    expect(sheet.name).toBe("S & 1");
    expect(sheet.grid.get(1)?.get(1)).toBe("Hi & bye");
    expect(excelDate(sheet.grid.get(2)?.get(2))).toBe("2026-10-18");
    expect(excelDate("3")).toBeNull();
    expect(columnIndex("AB")).toBe(28);
  });

  it("sets up My details, the period days and each period's entries", () => {
    const older = darSheet("2026-10-03", 15, { 19: { 0: "BAM design" }, 21: { 2: "Tested BCA" }, 27: { 4: "Orientation" } });
    const newer = darSheet("2026-10-18", 16, { 19: { 0: "NSC redesign" }, 20: { 15: "PDS redesign" } }, "Design UI of ERP CRM");
    const r = parseDarWorkbook(xlsx([{ name: "Oct 3 to Oct 17", cells: older }, { name: "Oct 18 to Nov 2", cells: newer }]));

    expect(r.profile).toMatchObject({
      fullName: "Juan D. Dela Cruz",
      position: "Information System Designer",
      department: "ICT Department",
      unit: "Data Management Unit",
      // The supervisor's name as typed in the header, not in capitals from the signature line.
      confirmedBy: { name: "Maria S. Santos", title: "OIC, Data Management Unit" },
      notedBy: { name: "ENGR. PEDRO REYES", title: "Department Manager" },
      periodScheme: "3-18",
      firstPeriodStart: "2026-10-03",
    });
    // The newest sheet's rows, plus the older sheet's MFO under the same duty.
    expect(r.profile.coreFunctions.map((f) => [f.duty, f.mfo, !!f.continues])).toEqual([
      ["Perform project mock-up designs", "Design UI of ERP Billing", false],
      ["", "Design UI of ERP CRM", true],
      ["", "Design UI of ERP HRM", true],
      ["Conduct QA testing", "Reports tested", false],
    ]);
    expect(r.profile.supportFunctions).toHaveLength(1);
    expect(darProfileInput.safeParse(r.profile).success).toBe(true);

    expect(r.periods.map((p) => [p.period.start, p.period.end, p.filledDays])).toEqual([
      ["2026-10-18", "2026-11-02", 2],
      ["2026-10-03", "2026-10-17", 3],
    ]);
    const [nov, oct] = r.periods;
    expect(nov.cells.core[0][0]).toBe("NSC redesign");
    expect(nov.cells.core[1][15]).toBe("PDS redesign"); // Nov 2, the 16th day
    expect(oct.cells.core[0][0]).toBe("BAM design");
    expect(oct.cells.core[2]).toEqual(Array(15).fill("")); // HRM row: dashes only
    expect(oct.cells.core[3][2]).toBe("Tested BCA");
    expect(oct.cells.support[0][4]).toBe("Orientation");
    expect(oct.dateSubmitted).toBe("2026-10-22");
    expect(r.warnings).toEqual([]);
  });

  it("spots the 1st–15th period days", () => {
    expect(detectScheme(["2026-10-01", "2026-10-16"])).toBe("1-16");
    expect(detectScheme(["2026-10-03", "2026-10-18", "2026-11-01"])).toBe("3-18");
  });

  it("refuses files that aren't a DAR workbook", () => {
    expect(() => parseDarWorkbook(strToU8("not a zip"))).toThrow(DarImportError);
    expect(() => parseDarWorkbook(xlsx([{ name: "Other", cells: { A1: "Budget" } }]))).toThrow(/No DAR was found/);
  });
});
