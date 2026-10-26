import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { exportFileName, toCsv, toXlsx, type ExportCase } from "@/lib/test-design/export";

const tc = (over: Partial<ExportCase> = {}): ExportCase => ({
  requirement: "Penalty rule",
  id: "tc1",
  title: "Payment one day late",
  technique: "Boundary value analysis",
  priority: "P1",
  type: "API",
  status: "APPROVED",
  processStep: null,
  preconditions: null,
  steps: ["Create bill", "Pay a day late"],
  expected: "Penalty matches the tariff oracle",
  tags: ["@critical", "@module:billing"],
  openQuestions: [],
  aiGenerated: true,
  ...over,
});

describe("toCsv", () => {
  it("starts with a UTF-8 BOM and a header row, with CRLF line ends", () => {
    const csv = toCsv([tc()]);
    expect(csv.startsWith("﻿Requirement,Case ID,Title,")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("quotes commas, quotes and newlines", () => {
    const csv = toCsv([tc({ title: 'Say "hi", then leave' })]);
    expect(csv).toContain('"Say ""hi"", then leave"');
    expect(csv).toContain('"1. Create bill\n2. Pay a day late"');
  });

  it("guards cells Excel would run as formulas", () => {
    const csv = toCsv([tc({ title: "=HYPERLINK(1)", expected: "-1 balance" })]);
    expect(csv).toContain(",'=HYPERLINK(1),");
    expect(csv).toContain(",'-1 balance,");
    expect(csv).toContain(",'@critical @module:billing,");
  });

  it("keeps ñ intact", () => {
    expect(toCsv([tc({ title: "QA-Peña Niño" })])).toContain("QA-Peña Niño");
  });
});

describe("toXlsx", () => {
  it("writes a workbook whose sheet holds the cases as text", async () => {
    const buf = await toXlsx([tc({ title: "QA-Peña Niño" }), tc({ id: "tc2", title: "=1+1" })]);
    const files = unzipSync(new Uint8Array(buf));
    expect(Object.keys(files)).toContain("xl/worksheets/sheet1.xml");
    const all = Object.values(files).map((f) => strFromU8(f)).join("\n");
    expect(all).toContain("QA-Peña Niño");
    expect(all).toContain("Test cases");
    expect(all).toContain("Expected result");
    expect(all).not.toMatch(/<f>/);
  });
});

describe("exportFileName", () => {
  it("slugs the base name and dates it", () => {
    expect(exportFileName("Penalty rule: Niño", "xlsx", new Date("2026-10-26T08:00:00Z"))).toBe("Penalty-rule-Nino-2026-10-26.xlsx");
    expect(exportFileName("???", "csv", new Date("2026-10-26T08:00:00Z"))).toBe("test-cases-2026-10-26.csv");
  });
});
