// The DAR as one self-contained landscape HTML page, laid out like the DCWD form. Print renders it in a hidden iframe;
// people who want a PDF pick "Save as PDF" in the print dialog. Every value is escaped: cells are free text.

import { longDate, periodLabel } from "./period";
import type { DarReportData } from "./store";
import type { DarFunction } from "./template";
import { isRestDay } from "./autofill";

/** The paper margin on every side, in inches. */
export const PRINT_MARGIN_IN = 0.5;
/** A landscape long bond page (13 × 8.5 in, the office paper) in CSS pixels. */
export const PRINT_PAPER = { width: 13 * 96, height: 8.5 * 96 };
/** The area inside the margins, in CSS pixels. Used to fit the sheet on one page. */
export const PRINT_PAGE = { width: PRINT_PAPER.width - 2 * PRINT_MARGIN_IN * 96, height: PRINT_PAPER.height - 2 * PRINT_MARGIN_IN * 96 };

/** The fills and colours of the DCWD DAR workbook, taken from its styles. */
export const DAR_COLORS = { label: "#ffcc99", coreHead: "#fbd4b4", address: "#808000" } as const;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const br = (s: string) => esc(s).replace(/\n/g, "<br>");

const CSS = `
  /* A zero page margin leaves the browser no room for its date, title, URL and page-number headers and footers;
     the real margin is the padding on html, equal on every side. */
  @page { size: 13in 8.5in; margin: 0; }
  /* Browsers drop background fills when printing unless told to keep them ("Background graphics" off by default). */
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { margin: 0; padding: ${PRINT_MARGIN_IN}in; background: #fff; }
  body { margin: 0; padding: 0; font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: 8.5pt; color: #000; background: #fff; }
  .banner { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 4px; }
  .seal { width: 46px; height: 46px; justify-self: center; margin-right: 12px; }
  .agency { text-align: center; line-height: 1.25; }
  .agency .rp { font-size: 7.5pt; font-weight: bold; }
  .agency .dcwd { font-size: 9pt; font-weight: bold; }
  .agency .addr { font-size: 7pt; font-weight: bold; color: ${DAR_COLORS.address}; }
  h1 { text-align: center; font-family: "Book Antiqua", Palatino, "Palatino Linotype", serif; font-size: 11.5pt; margin: 6px 0 8px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  table { border-collapse: collapse; }
  .info td { border: 1px solid #000; padding: 1px 6px; font-size: 8pt; }
  .info td.k { background: ${DAR_COLORS.label}; font-weight: bold; width: 120px; }
  .info td.v { width: 340px; }
  .info td.c { border: none; border-top: 1px solid #000; border-bottom: 1px solid #000; width: 10px; text-align: center; padding: 1px 0; }
  .sub { margin-top: 8px; font-weight: bold; font-size: 8pt; }
  .sub i { font-weight: normal; display: block; margin-left: 140px; font-size: 7.5pt; }
  .right { text-align: right; line-height: 1.6; font-size: 8.5pt; }
  .right b { display: inline-block; min-width: 130px; text-align: right; text-decoration: underline; }
  .grid { width: 100%; table-layout: fixed; margin-top: 2px; }
  .grid td, .grid th { border: 1px solid #000; padding: 2px 3px; vertical-align: middle; }
  .grid th { background: ${DAR_COLORS.label}; font-size: 7pt; font-weight: bold; text-align: center; line-height: 1.15; }
  .grid th.plain { background: #fff; }
  .grid th.core { background: ${DAR_COLORS.coreHead}; }
  .grid td { font-size: 7.5pt; line-height: 1.2; }
  .grid td.n { text-align: center; width: 18px; }
  .grid td.duty, .grid td.mfo { white-space: normal; }
  .grid td.day { text-align: center; font-size: 7pt; }
  .grid td.rest { text-transform: uppercase; }
  .sign { display: grid; grid-template-columns: 1.1fr 1.6fr 3fr; margin-top: 26px; font-size: 8.5pt; }
  .sign .lbl { font-weight: bold; margin-bottom: 26px; }
  .sign .name { font-weight: bold; }
`;

function dayHeads(r: DarReportData): string {
  return r.days.map((d) => `<th>${d.month}<br>${d.day}<br>${d.dow}</th>`).join("");
}

function rows(fns: DarFunction[], cells: string[][]): string {
  return fns
    .map((f, i) => {
      const days = (cells[i] ?? []).map((c) => `<td class="day${isRestDay(c) ? " rest" : ""}">${br(c)}</td>`).join("");
      return `<tr><td class="n">${i + 1}</td><td class="duty">${br(f.duty)}</td><td class="mfo">${br(f.mfo)}</td>${days}</tr>`;
    })
    .join("");
}

export function darHtml(r: DarReportData, opts: { seal?: string; title?: string } = {}): string {
  const h = r.header;
  const n = r.days.length;
  const info = (k: string, v: string) => `<tr><td class="k">${k}</td><td class="c">:</td><td class="v">${esc(v)}</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(opts.title ?? "Daily Accomplishment Report")}</title><style>${CSS}</style></head>
<body>
  <div class="banner">
    <div></div>
    <div style="display:flex;align-items:center">
      ${opts.seal ? `<img class="seal" src="${esc(opts.seal)}" alt="">` : ""}
      <div class="agency">
        <div class="rp">Republic of the Philippines</div>
        <div class="dcwd">DAVAO CITY WATER DISTRICT</div>
        <div class="addr">Km 2.5 MacArthur Highway, Matina, Davao City</div>
      </div>
    </div>
    <div></div>
  </div>
  <h1>Project-Based Employee Daily Accomplishment Report</h1>

  <div class="head">
    <div>
      <table class="info">
        ${info("Name of PBE", h.name)}
        ${info("Position Title", h.position)}
        ${info("Department", h.department)}
        ${info("Unit", h.unit)}
        ${info("Immediate Supervisor", h.supervisor)}
        ${info("Period Covered", periodLabel(r.period))}
      </table>
      <div class="sub">SPECIFIC DUTIES AND RESPONSIBILITIES:<i>Please indicate the actual accomplishment</i></div>
    </div>
    <div class="right">
      Date Submitted : <b>${esc(longDate(r.dateSubmitted))}</b><br>
      Actual No. of Days Attended : <b>${r.daysAttended} Days</b>
    </div>
  </div>

  <table class="grid">
    <colgroup><col style="width:18px"><col style="width:17%"><col style="width:15%">${r.days.map(() => "<col>").join("")}</colgroup>
    <tr><th class="plain" colspan="3"></th><th class="plain" colspan="${n}">DAYS</th></tr>
    <tr><th class="plain" colspan="3"></th>${r.days.map((_, i) => `<th class="plain">${i + 1}</th>`).join("")}</tr>
    <tr><th class="core" colspan="2">A.) CORE FUNCTIONS</th><th>MAJOR FINAL OUTPUT (MFOs)</th>${dayHeads(r)}</tr>
    ${rows(h.core, r.cells.core)}
    <tr><th colspan="2">B.) SUPPORT FUNCTION</th><th>MAJOR FINAL OUTPUT (MFOs)</th>${dayHeads(r)}</tr>
    ${rows(h.support, r.cells.support)}
  </table>

  <div class="sign">
    <div><div class="lbl">Prepared by:</div><div class="name">${esc(h.name)}</div><div>${esc(h.position)}</div></div>
    <div><div class="lbl">Confirmed by:</div><div class="name">${esc(h.confirmedBy.name)}</div><div>${esc(h.confirmedBy.title)}</div></div>
    <div><div class="lbl">Noted by:</div><div class="name">${esc(h.notedBy.name)}</div><div>${esc(h.notedBy.title)}</div></div>
  </div>
</body></html>`;
}
