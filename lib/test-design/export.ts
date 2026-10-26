import writeXlsxFile, { type Row } from "write-excel-file/node";

export type ExportCase = {
  requirement: string;
  id: string;
  title: string;
  technique: string;
  priority: string;
  type: string;
  status: string;
  processStep: string | null;
  preconditions: string | null;
  steps: string[];
  expected: string;
  tags: string[];
  openQuestions: string[];
  aiGenerated: boolean;
};

const COLUMNS: { header: string; width: number; value: (c: ExportCase) => string }[] = [
  { header: "Requirement", width: 28, value: (c) => c.requirement },
  { header: "Case ID", width: 14, value: (c) => c.id },
  { header: "Title", width: 40, value: (c) => c.title },
  { header: "Technique", width: 22, value: (c) => c.technique },
  { header: "Priority", width: 9, value: (c) => c.priority },
  { header: "Type", width: 9, value: (c) => c.type },
  { header: "Status", width: 11, value: (c) => c.status },
  { header: "Process step", width: 28, value: (c) => c.processStep ?? "" },
  { header: "Preconditions", width: 34, value: (c) => c.preconditions ?? "" },
  { header: "Steps", width: 50, value: (c) => c.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") },
  { header: "Expected result", width: 44, value: (c) => c.expected },
  { header: "Tags", width: 28, value: (c) => c.tags.join(" ") },
  { header: "Open questions", width: 36, value: (c) => c.openQuestions.join("\n") },
  { header: "Source", width: 10, value: (c) => (c.aiGenerated ? "AI draft" : "Manual") },
];

/** Excel runs a cell that starts with one of these as a formula, so CSV cells get a leading apostrophe. */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(v: string): string {
  const safe = FORMULA_START.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV with CRLF line ends and a UTF-8 BOM, so Excel shows ñ correctly. */
export function toCsv(cases: ExportCase[]): string {
  const rows = [COLUMNS.map((c) => c.header), ...cases.map((tc) => COLUMNS.map((c) => c.value(tc)))];
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export async function toXlsx(cases: ExportCase[]): Promise<Buffer> {
  const header: Row = COLUMNS.map((c) => ({ value: c.header, fontWeight: "bold", backgroundColor: "#E8E9FB" }));
  // Typed String cells are stored as text, so a value starting with "=" or "@" is never run as a formula.
  const body: Row[] = cases.map((tc) => COLUMNS.map((c) => ({ value: c.value(tc), type: String, wrap: true, alignVertical: "top" })));
  return writeXlsxFile([header, ...body], {
    sheet: "Test cases",
    columns: COLUMNS.map((c) => ({ width: c.width })),
    stickyRowsCount: 1,
  }).toBuffer();
}

export function exportFileName(base: string, ext: "csv" | "xlsx", now = new Date()): string {
  const slug = base.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "test-cases";
  return `${slug}-${now.toISOString().slice(0, 10)}.${ext}`;
}
