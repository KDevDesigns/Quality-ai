// The DAR as an .xlsx laid out like the DCWD form, so it can still be adjusted in Excel before printing.
// Every value is a typed String cell, so text starting with "=" is never run as a formula.

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import writeXlsxFile, { type Cell, type Row } from "write-excel-file/node";
import { longDate, periodLabel } from "./period";
import type { DarReportData } from "./store";
import { dutyLayout, type DarFunction } from "./template";

// The DCWD workbook's own fills and colours (see DAR_COLORS in ./html).
const ORANGE = "#FFCC99";
const CORE_HEAD = "#FBD4B4";
const OLIVE = "#808000";
const LINE = { borderStyle: "thin", borderColor: "#000000" } as const;

type Spec = Exclude<Cell, null>;

/** A row of `width` empty cells with the given cells placed at their column. Spanned-over cells stay null. */
function row(width: number, placed: [number, Spec][], height?: number): Row {
  const r: Row = Array.from({ length: width }, () => null);
  for (const [col, cell] of placed) r[col] = cell;
  if (!height) return r;
  // The height rides on the row's first cell. A row under a merged duty cell must keep those columns null, so it uses
  // its first placed cell instead.
  const at = r[0] !== null || !placed.length ? 0 : Math.min(...placed.map(([c]) => c));
  r[at] = r[at] ? ({ ...r[at], height } as Spec) : { value: "", type: String, height };
  return r;
}

const text = (value: string, style: Omit<Spec, "value" | "type"> = {}): Spec => ({ value, type: String, ...style }) as Spec;

/** A bordered cell merged across `span` columns (the cells it covers must stay null). */
function boxed(_width: number, from: number, span: number, cell: Spec): [number, Spec][] {
  return [[from, { ...cell, ...LINE, ...(span > 1 ? { columnSpan: span } : {}) } as Spec]];
}

/**
 * Excel doesn't grow a row to fit wrapped text it didn't type itself, so estimate the height from the text.
 * `dutyRows`: how many rows the duty cell spans; a duty spread over several MFO rows only needs its share of the height.
 */
function rowHeight(f: DarFunction, dutyRows = 1): number {
  // About this many 8 pt characters fit on a line of the duty (34 wide) and MFO (32 wide) columns.
  const lines = (s: string, perLine: number) => s.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return Math.max(30, Math.max(Math.ceil(lines(f.duty, 38) / dutyRows), lines(f.mfo, 36)) * 11 + 8);
}

/** `seal` is the DCWD seal PNG, placed left of the agency name. */
export async function darXlsx(r: DarReportData, seal?: Buffer): Promise<Buffer> {
  const h = r.header;
  const n = r.days.length;
  const W = 3 + n;
  const center = { align: "center", alignVertical: "center", wrap: true } as const;
  const head = { ...center, fontWeight: "bold", backgroundColor: ORANGE, fontSize: 8, ...LINE } as const;

  const rows: Row[] = [];
  const banner = (value: string, style: Omit<Spec, "value" | "type">) => rows.push(row(W, [[0, text(value, { columnSpan: W, align: "center", ...style })]]));
  banner("Republic of the Philippines", { fontWeight: "bold", fontSize: 8 });
  banner("DAVAO CITY WATER DISTRICT", { fontWeight: "bold", fontSize: 10 });
  banner("Km 2.5 MacArthur Highway, Matina, Davao City", { fontWeight: "bold", fontSize: 8, color: OLIVE });
  banner("Project-Based Employee Daily Accomplishment Report", { fontWeight: "bold", fontSize: 12, fontFamily: "Book Antiqua" });
  rows.push(row(W, []));

  // Header block: labels and values on the left, date submitted and days attended on the right.
  const valueSpan = Math.max(2, Math.min(5, n - 6));
  const rightFrom = W - 5;
  const info: [string, string][] = [
    ["Name of PBE", h.name],
    ["Position Title", h.position],
    ["Department", h.department],
    ["Unit", h.unit],
    ["Immediate Supervisor", h.supervisor],
    ["Period Covered", periodLabel(r.period)],
  ];
  info.forEach(([k, v], i) => {
    const placed: [number, Spec][] = [
      ...boxed(W, 0, 2, text(`${k} :`, { fontWeight: "bold", fontSize: 8, backgroundColor: ORANGE })),
      ...boxed(W, 2, valueSpan, text(v, { fontSize: 8 })),
    ];
    if (i === 0) placed.push([rightFrom, text("Date Submitted :", { columnSpan: 3, align: "right", fontWeight: "bold" })], [rightFrom + 3, text(longDate(r.dateSubmitted), { columnSpan: 2, align: "right", fontWeight: "bold" })]);
    if (i === 1) placed.push([rightFrom, text("Actual No. of Days Attended :", { columnSpan: 3, align: "right", fontWeight: "bold" })], [rightFrom + 3, text(`${r.daysAttended} Days`, { columnSpan: 2, align: "right", fontWeight: "bold" })]);
    rows.push(row(W, placed));
  });
  rows.push(row(W, [[0, text("SPECIFIC DUTIES AND RESPONSIBILITIES:", { columnSpan: 3, fontWeight: "bold", fontSize: 8 })]]));
  rows.push(row(W, [[1, text("Please indicate the actual accomplishment", { columnSpan: 2, fontSize: 7, align: "center" })]]));

  // The grid.
  const days = r.days.map((d, i): [number, Spec] => [3 + i, text(`${d.month}\n${d.day}\n${d.dow}`, head)]);
  rows.push(row(W, [...boxed(W, 0, 3, text("", center)), ...boxed(W, 3, n, text("DAYS", { ...center, fontWeight: "bold", fontSize: 8 }))]));
  rows.push(row(W, [...boxed(W, 0, 3, text("", center)), ...r.days.map((_, i): [number, Spec] => [3 + i, text(String(i + 1), { ...center, fontSize: 8, ...LINE })])]));

  const section = (title: string, fns: DarFunction[], cells: string[][], titleFill = ORANGE) => {
    rows.push(row(W, [...boxed(W, 0, 2, text(title, { ...head, backgroundColor: titleFill })), [2, text("MAJOR FINAL OUTPUT (MFOs)", head)], ...days], 36));
    // A duty with several MFOs: its number and duty cells span its rows (the cells they cover stay null).
    const layout = dutyLayout(fns);
    fns.forEach((f, i) => {
      const { number, span } = layout[i];
      const merged = span > 1 ? { rowSpan: span } : {};
      rows.push(
        row(W, [
          ...(span
            ? ([
                [0, text(String(number), { ...center, fontSize: 8, ...LINE, ...merged })],
                [1, text(f.duty, { wrap: true, alignVertical: "center", fontSize: 8, ...LINE, ...merged })],
              ] as [number, Spec][])
            : []),
          [2, text(f.mfo, { wrap: true, alignVertical: "center", fontSize: 8, ...LINE })],
          ...(cells[i] ?? []).map((c, j): [number, Spec] => [3 + j, text(c, { ...center, fontSize: 7.5, ...LINE })]),
        ], rowHeight(f, Math.max(1, span))),
      );
    });
  };
  section("A.) CORE FUNCTIONS", h.core, r.cells.core, CORE_HEAD);
  section("B.) SUPPORT FUNCTION", h.support, r.cells.support);

  // Signatories.
  const signCols: [number, number][] = [
    [0, 2],
    [2, 1],
    [3, Math.min(8, n)],
  ];
  const signRow = (values: string[], style: Omit<Spec, "value" | "type">) =>
    rows.push(row(W, signCols.map(([c, span], i): [number, Spec] => [c, text(values[i], { columnSpan: span, ...style })])));
  rows.push(row(W, []));
  signRow(["Prepared by:", "Confirmed by:", "Noted by:"], { fontWeight: "bold" });
  rows.push(row(W, []));
  signRow([h.name, h.confirmedBy.name, h.notedBy.name], { fontWeight: "bold" });
  signRow([h.position, h.confirmedBy.title, h.notedBy.title], {});

  const widths = [4, 34, 32, ...r.days.map(() => 11)];
  // The seal sits just left of the centred agency name (about 22 characters left of the middle).
  const target = widths.reduce((a, b) => a + b, 0) / 2 - 22;
  let acc = 0;
  let sealCol = 0;
  while (sealCol < widths.length - 1 && acc + widths[sealCol] < target) acc += widths[sealCol++];

  const xlsx = await writeXlsxFile(
    rows,
    {
      sheet: "DAR",
      columns: widths.map((width) => ({ width })),
      orientation: "landscape",
      showGridLines: false,
      images: seal ? [{ content: seal, contentType: "image/png", width: 52, height: 52, dpi: 96, anchor: { row: 1, column: sealCol + 1 }, title: "DCWD seal" }] : undefined,
    },
    { fontFamily: "Calibri", fontSize: 9 },
  ).toBuffer();
  return longBondOnOnePage(xlsx);
}

/**
 * write-excel-file can't set the paper, so this edits the sheet's page setup directly: long bond (8.5 × 13 in, Excel
 * paper size 14, "Folio"), landscape, even 0.5 in margins (as on the printout), and "fit to 1 page wide by 1 tall" so it prints like it.
 */
export function longBondOnOnePage(xlsx: Buffer): Buffer {
  const files = unzipSync(new Uint8Array(xlsx));
  const name = "xl/worksheets/sheet1.xml";
  let xml = strFromU8(files[name]);
  const margins = '<pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0" footer="0"/>';
  const setup = '<pageSetup paperSize="14" orientation="landscape" fitToWidth="1" fitToHeight="1"/>';
  xml = xml.replace(/<pageMargins[^>]*\/>/, "").replace(/<pageSetup[^>]*\/>/, "");
  // Schema order: pageMargins and pageSetup come after mergeCells and before drawing.
  xml = /<drawing /.test(xml) ? xml.replace(/<drawing /, `${margins}${setup}<drawing `) : xml.replace("</worksheet>", `${margins}${setup}</worksheet>`);
  // sheetPr must be the worksheet's first child.
  const fit = '<pageSetUpPr fitToPage="1"/>';
  if (/<sheetPr[^>]*\/>/.test(xml)) xml = xml.replace(/<sheetPr([^>]*)\/>/, `<sheetPr$1>${fit}</sheetPr>`);
  else if (/<sheetPr[\s>]/.test(xml)) xml = xml.replace(/<sheetPr([^>]*)>/, `<sheetPr$1>${fit}`);
  else xml = xml.replace(/(<worksheet[^>]*>)/, `$1<sheetPr>${fit}</sheetPr>`);
  files[name] = strToU8(xml);
  return Buffer.from(zipSync(files));
}
