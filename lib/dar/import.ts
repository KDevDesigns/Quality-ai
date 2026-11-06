// Reads a person's own DAR Excel workbook (the DCWD form, one sheet per period) so My DAR can be set up from it: the
// header, the signatories, the duties and MFOs, the period days, and each period's day entries. Runs in the browser:
// the file is never uploaded, only what this reads is sent when they click Import. Pure functions, unit-tested.
//
// The form is found by its labels, not fixed cells, because sheets drift ("Name of JOE" in column A or B, 15 or 16 day
// columns, a typo in a date). Dates come from the first date in the core functions' header row, one day per column.

import { strFromU8, unzipSync } from "fflate";
import { CELL_MAX, type DarCells } from "./autofill";
import { addDays, DEFAULT_SCHEME, periodDays, periodFor, periodLabel, PERIOD_SCHEMES, type Period, type PeriodScheme } from "./period";
import { MAX_FUNCTION_ROWS, type DarFunction, type DarProfileInput, type Signatory } from "./template";

// ---------------------------------------------------------------------------------------------------------------------
// The workbook: sheets of text cells

/** A sheet's cells as text, by row then column (both 1-based). */
export type Grid = Map<number, Map<number, string>>;
export type WorkbookSheet = { name: string; grid: Grid };

/** The biggest file read (the form is a few hundred KB; images in it add more). */
export const MAX_IMPORT_BYTES = 15 * 1024 * 1024;

export class DarImportError extends Error {}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITY[e.toLowerCase()],
  );

const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

/** The text of an `<si>` or `<is>`: its `<t>` runs, without phonetic hints. */
const runText = (xml: string) =>
  [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g)].map((m) => decode(m[1] ?? "")).join("");

/** "AB" → 28. */
export function columnIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/** Every sheet of an .xlsx, in workbook order, as text cells. */
export function readWorkbook(bytes: Uint8Array): WorkbookSheet[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => (f.name.startsWith("xl/") && f.name.endsWith(".xml")) || f.name.endsWith(".rels") });
  } catch {
    throw new DarImportError("This isn't an Excel file QA Hub can read. Save it as .xlsx (Excel Workbook) and try again.");
  }
  const read = (name: string) => (files[name] ? strFromU8(files[name]) : null);
  const workbook = read("xl/workbook.xml");
  if (!workbook) throw new DarImportError("This isn't an Excel file QA Hub can read. Save it as .xlsx (Excel Workbook) and try again.");

  const shared = [...(read("xl/sharedStrings.xml") ?? "").matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => runText(m[1]));
  const rels = new Map(
    [...(read("xl/_rels/workbook.xml.rels") ?? "").matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const target = (attr(m[0], "Target") ?? "").replace(/^\/?xl\//, "").replace(/^\//, "");
      return [attr(m[0], "Id") ?? "", `xl/${target}`] as const;
    }),
  );

  return [...workbook.matchAll(/<sheet\b[^>]*>/g)].flatMap((m) => {
    const name = decode(attr(m[0], "name") ?? "");
    const path = rels.get(attr(m[0], "r:id") ?? "");
    const xml = path ? read(path) : null;
    if (!xml || attr(m[0], "state") === "hidden" || attr(m[0], "state") === "veryHidden") return [];
    const grid: Grid = new Map();
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /^([A-Z]+)(\d+)$/.exec(attr(c[1], "r") ?? "");
      if (!ref || !c[2]) continue;
      const type = attr(c[1], "t");
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2])?.[1];
      const value = type === "s" ? (shared[Number(v)] ?? "") : type === "inlineStr" ? runText(/<is>([\s\S]*?)<\/is>/.exec(c[2])?.[1] ?? "") : decode(v ?? "");
      if (!value.trim()) continue;
      const row = Number(ref[2]);
      if (!grid.has(row)) grid.set(row, new Map());
      grid.get(row)!.set(columnIndex(ref[1]), value);
    }
    return [{ name, grid }];
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// One sheet: the DCWD DAR form

export type ImportedRow = { fn: DarFunction; /** The day's entry by date ("2026-10-18"). */ days: Record<string, string> };
export type ImportedSheet = {
  name: string;
  fullName: string;
  position: string;
  department: string;
  unit: string;
  supervisor: string;
  confirmedBy: Signatory;
  notedBy: Signatory;
  dateSubmitted: string | null;
  /** Every day column's date, in order. */
  dates: string[];
  core: ImportedRow[];
  support: ImportedRow[];
};

/** Spaces tidied, line breaks kept. */
const clean = (s: string) =>
  s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .trim();
/** For matching: lower case, single spaces, no punctuation at the ends. */
const key = (s: string) => clean(s).toLowerCase().replace(/\s+/g, " ").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");

/** A day cell's entry: the form's dashes and "n/a" mean nothing was done that day. */
const entry = (s: string | undefined) => {
  const v = clean(s ?? "");
  return /^([-–—_.]+|n\/?a)$/i.test(v) ? "" : v;
};

/** An Excel date number (1900 date system) as "YYYY-MM-DD", or null. Only plausible DAR years count. */
export function excelDate(v: string | undefined): string | null {
  if (!v || !/^\d+(\.\d+)?$/.test(v.trim())) return null;
  const n = Math.floor(Number(v));
  if (n < 36526 || n > 73051) return null; // 2000-01-01 to 2099-12-31
  return addDays("1970-01-01", n - 25569);
}

const DOW = /^(sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?$/i;
const SIGN_LABEL = /^(prepared|reviewed|confirmed|approved|noted|certified)\s+by\b/i;

function cellsOf(grid: Grid, row: number): [number, string][] {
  return [...(grid.get(row) ?? new Map<number, string>()).entries()].sort((a, b) => a[0] - b[0]);
}

/** Where a label is on the sheet ("Name of JOE :"), and the value written to its right. */
function labelled(grid: Grid, test: RegExp): { row: number; col: number; value: string } | null {
  for (const row of [...grid.keys()].sort((a, b) => a - b)) {
    const cells = cellsOf(grid, row);
    const i = cells.findIndex(([, v]) => test.test(clean(v).replace(/[\s:]+$/, "")));
    if (i < 0) continue;
    const value = cells.slice(i + 1).map(([, v]) => clean(v).replace(/^:\s*/, "")).find((v) => v && v !== ":") ?? "";
    return { row, col: cells[i][0], value };
  }
  return null;
}

/** The name and title under a signature label: the first two lines of text below it. */
function signatory(grid: Grid, test: RegExp): Signatory {
  const at = labelled(grid, test);
  if (!at) return { name: "", title: "" };
  const below: string[] = [];
  const last = Math.max(...grid.keys());
  for (let r = at.row + 1; r <= Math.min(last, at.row + 12) && below.length < 2; r++) {
    const v = cellsOf(grid, r).find(([c]) => c >= at.col && c <= at.col + 4)?.[1];
    if (v && !SIGN_LABEL.test(clean(v))) below.push(clean(v));
  }
  return { name: below[0] ?? "", title: below[1] ?? "" };
}

/** Reads one sheet, or null when it isn't a DAR form (no core functions with dates). */
export function parseDarSheet(sheet: WorkbookSheet): ImportedSheet | null {
  const { grid } = sheet;
  const rows = [...grid.keys()].sort((a, b) => a - b);
  const find = (test: RegExp) => {
    for (const r of rows) for (const [c, v] of cellsOf(grid, r)) if (test.test(clean(v))) return { row: r, col: c };
    return null;
  };
  const core = find(/core\s+functions?/i);
  if (!core) return null;
  const support = find(/support\s+functions?/i);
  const mfoCol = cellsOf(grid, core.row).find(([, v]) => /major\s+final\s+output|mfo/i.test(v))?.[0] ?? core.col + 6;

  // The day columns: from the first date in the core header row, one day per column, while the header row or the
  // weekday row under it still has something there.
  const headerCells = cellsOf(grid, core.row).filter(([c]) => c > mfoCol);
  const firstDated = headerCells.find(([, v]) => excelDate(v));
  if (!firstDated) return null;
  const firstCol = firstDated[0];
  const firstDate = excelDate(firstDated[1])!;
  const dowRow = grid.get(core.row + 1);
  const dates: string[] = [];
  for (let c = firstCol; c < firstCol + 31; c++) {
    const head = grid.get(core.row)?.get(c);
    const dow = dowRow?.get(c);
    if (!(head && excelDate(head)) && !(dow && DOW.test(clean(dow)))) break;
    dates.push(addDays(firstDate, c - firstCol));
  }

  const signRow = find(SIGN_LABEL)?.row ?? (rows.at(-1) ?? 0) + 1;
  const section = (from: number, to: number): ImportedRow[] => {
    const out: ImportedRow[] = [];
    for (const r of rows) {
      if (r <= from || r >= to) continue;
      const cells = cellsOf(grid, r);
      const left = cells.filter(([c]) => c < firstCol);
      // The weekday row under a section header.
      if (!left.length && cells.some(([, v]) => DOW.test(clean(v)))) continue;
      const beforeMfo = left.filter(([c]) => c < mfoCol);
      const numbered = beforeMfo.find(([, v]) => /^\d+(\.0+)?\.?$/.test(clean(v)));
      const duty = clean(beforeMfo.filter((x) => x !== numbered).map(([, v]) => v).join("\n"));
      const mfo = clean(left.filter(([c]) => c >= mfoCol).map(([, v]) => v).join("\n"));
      const days: Record<string, string> = {};
      dates.forEach((d, i) => {
        const v = entry(grid.get(r)?.get(firstCol + i));
        if (v) days[d] = v.slice(0, CELL_MAX);
      });
      if (!duty && !mfo && !Object.keys(days).length) continue;
      // A row with no number and no duty is another MFO of the duty above, as the form merges the duty cell.
      const continues = !duty && !numbered && out.length > 0;
      out.push({ fn: { duty: continues ? "" : (duty || mfo).slice(0, 1000), mfo: mfo.slice(0, 1000), autofill: false, ...(continues ? { continues: true } : {}) }, days });
    }
    return out;
  };

  const supervisor = labelled(grid, /^immediate\s+supervisor/i)?.value ?? "";
  const reviewed = signatory(grid, /^(reviewed|confirmed)\s+by/i);
  // The supervisor's name as typed in the header (not in capitals, as signature lines often are), when it's the same person.
  const same = (a: string, b: string) => a.replace(/[^a-z]/gi, "").toLowerCase() === b.replace(/[^a-z]/gi, "").toLowerCase();
  return {
    name: sheet.name,
    fullName: labelled(grid, /^name\s+of\b|^name$/i)?.value ?? "",
    position: labelled(grid, /^position(\s+title)?$/i)?.value ?? "",
    department: labelled(grid, /^department$/i)?.value ?? "",
    unit: labelled(grid, /^unit$/i)?.value ?? "",
    supervisor,
    confirmedBy: { name: supervisor && same(supervisor, reviewed.name) ? supervisor : reviewed.name || supervisor, title: reviewed.title },
    notedBy: signatory(grid, /^(approved|noted)\s+by/i),
    dateSubmitted: excelDate(labelled(grid, /date\s+submitted/i)?.value),
    dates,
    core: section(core.row, support?.row ?? signRow),
    support: support ? section(support.row, signRow) : [],
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// The whole file: My details plus a DAR per period

export type ImportedPeriod = {
  period: Period;
  label: string;
  sheetName: string;
  cells: DarCells;
  /** Days with any entry. */
  filledDays: number;
  dateSubmitted: string | null;
};

export type DarImport = {
  profile: DarProfileInput & { periodScheme: PeriodScheme };
  periods: ImportedPeriod[];
  /** Things the person should check, in plain words. */
  warnings: string[];
};

/** The scheme most sheets start on: the 1st or 16th, or the 3rd or 18th (a day either side still counts). */
export function detectScheme(firstDays: string[]): PeriodScheme {
  const votes: Record<PeriodScheme, number> = { "1-16": 0, "3-18": 0 };
  for (const d of firstDays) {
    const day = Number(d.slice(8));
    if ([2, 3, 4, 17, 18, 19].includes(day)) votes["3-18"]++;
    else votes["1-16"]++;
  }
  return PERIOD_SCHEMES.reduce((best, s) => (votes[s] > votes[best] ? s : best), DEFAULT_SCHEME);
}

type Section = "core" | "support";

/**
 * Every duty row seen in any sheet, in the newest sheet's order, with rows only older sheets have added after the
 * other rows of their duty. A row is the same row in two sheets when its duty and MFO read the same.
 */
function mergeRows(sheets: ImportedSheet[], section: Section): { rows: DarFunction[]; keys: string[] } {
  const rows: DarFunction[] = [];
  const keys: string[] = [];
  const dutyOf: string[] = [];
  for (const sheet of sheets) {
    let duty = "";
    for (const { fn } of sheet[section]) {
      if (!fn.continues) duty = fn.duty;
      const k = `${key(duty)}|${key(fn.mfo)}`;
      if (keys.includes(k)) continue;
      // After the last row of the same duty, or at the end as a new duty.
      const lastOfDuty = dutyOf.lastIndexOf(key(duty));
      const at = lastOfDuty >= 0 ? lastOfDuty + 1 : rows.length;
      const row: DarFunction = lastOfDuty >= 0 ? { duty: "", mfo: fn.mfo, autofill: false, continues: true } : { duty, mfo: fn.mfo, autofill: false };
      rows.splice(at, 0, row);
      keys.splice(at, 0, k);
      dutyOf.splice(at, 0, key(duty));
    }
  }
  return { rows, keys };
}

/** Reads a DAR workbook into My details and one DAR per period. Throws DarImportError with a message to show. */
export function parseDarWorkbook(bytes: Uint8Array): DarImport {
  if (bytes.byteLength > MAX_IMPORT_BYTES) throw new DarImportError("This file is too big to be a DAR. Pick your DAR workbook (.xlsx).");
  const sheets = readWorkbook(bytes)
    .map(parseDarSheet)
    .filter((s): s is ImportedSheet => !!s && s.dates.length > 0)
    // Newest first: its header and rows lead.
    .sort((a, b) => b.dates[0].localeCompare(a.dates[0]));
  if (!sheets.length) throw new DarImportError("No DAR was found in this file. Each sheet should be the DAR form, with the core functions and a row of dates.");

  const warnings: string[] = [];
  const scheme = detectScheme(sheets.map((s) => s.dates[0]));
  const newest = sheets[0];
  const merged = { core: mergeRows(sheets, "core"), support: mergeRows(sheets, "support") };
  for (const section of ["core", "support"] as const) {
    if (merged[section].rows.length > MAX_FUNCTION_ROWS) {
      warnings.push(`Only the first ${MAX_FUNCTION_ROWS} ${section} function rows were kept; the file has ${merged[section].rows.length}.`);
      merged[section].rows.length = MAX_FUNCTION_ROWS;
      merged[section].keys.length = MAX_FUNCTION_ROWS;
    }
  }

  // One DAR per period. Two sheets for the same period (a copy kept by mistake): the newer one's entries win.
  const byPeriod = new Map<string, ImportedPeriod>();
  for (const sheet of [...sheets].reverse()) {
    const period = periodFor(sheet.dates[0], scheme);
    const days = periodDays(period).map((d) => d.date);
    const outside = sheet.dates.filter((d) => d < period.start || d > period.end);
    if (outside.length) warnings.push(`"${sheet.name}": ${outside.length} day${outside.length === 1 ? "" : "s"} outside ${periodLabel(period)} ${outside.length === 1 ? "was" : "were"} left out.`);
    const cellsFor = (section: Section) => {
      const out = merged[section].keys.map(() => days.map(() => ""));
      let duty = "";
      for (const { fn, days: entries } of sheet[section]) {
        if (!fn.continues) duty = fn.duty;
        const i = merged[section].keys.indexOf(`${key(duty)}|${key(fn.mfo)}`);
        if (i < 0) continue;
        days.forEach((d, j) => {
          if (entries[d]) out[i][j] = out[i][j] ? `${out[i][j]}; ${entries[d]}`.slice(0, CELL_MAX) : entries[d];
        });
      }
      return out;
    };
    const cells = { core: cellsFor("core"), support: cellsFor("support") };
    const filledDays = days.filter((_, j) => [...cells.core, ...cells.support].some((r) => r[j])).length;
    byPeriod.set(period.start, { period, label: periodLabel(period), sheetName: sheet.name, cells, filledDays, dateSubmitted: sheet.dateSubmitted });
  }
  const periods = [...byPeriod.values()].sort((a, b) => b.period.start.localeCompare(a.period.start));

  const cut = (s: string, n: number) => s.slice(0, n);
  return {
    profile: {
      fullName: cut(newest.fullName, 120),
      position: cut(newest.position, 120),
      department: cut(newest.department, 160),
      unit: cut(newest.unit, 160),
      confirmedBy: { name: cut(newest.confirmedBy.name, 120), title: cut(newest.confirmedBy.title, 160) },
      notedBy: { name: cut(newest.notedBy.name, 120), title: cut(newest.notedBy.title, 160) },
      coreFunctions: merged.core.rows,
      supportFunctions: merged.support.rows,
      firstPeriodStart: periods.at(-1)!.period.start,
      periodScheme: scheme,
    },
    periods,
    warnings,
  };
}
