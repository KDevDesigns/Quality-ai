import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { cleanText, extractRequirementText, MAX_FILE_BYTES, MAX_TEXT_CHARS } from "@/lib/test-design/extract";

/** Smallest .docx mammoth accepts: content types, package rels and one document part. */
function docx(paragraphs: string[]): Uint8Array {
  const body = paragraphs.map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`).join("");
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/document.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
    ),
  });
}

/** A one-page PDF with a correct xref table; an empty content stream stands in for a scanned page. */
function pdf(text: string | null): Uint8Array {
  const content = text ? `BT /F1 12 Tf 72 720 Td (${text}) Tj ET` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return strToU8(out);
}

describe("cleanText", () => {
  it("strips the BOM, normalizes line ends and collapses blank runs", () => {
    expect(cleanText("﻿Line 1  \r\n\r\n\r\n\r\nLine 2\rLine 3\n")).toBe("Line 1\n\nLine 2\nLine 3");
  });
});

describe("extractRequirementText", () => {
  it("reads markdown and text as UTF-8, keeping ñ", async () => {
    expect(await extractRequirementText("rule.md", strToU8("# Penalty\n\nApplies to Señor accounts."))).toBe("# Penalty\n\nApplies to Señor accounts.");
    expect(await extractRequirementText("RULE.TXT", strToU8("﻿Plain text"))).toBe("Plain text");
  });

  it("reads .docx paragraphs", async () => {
    const text = await extractRequirementText("rule.docx", docx(["Tariff tiers apply per class.", "Niño accounts are residential."]));
    expect(text).toContain("Tariff tiers apply per class.");
    expect(text).toContain("Niño accounts are residential.");
  });

  it("reads a PDF with a text layer", async () => {
    expect(await extractRequirementText("rule.pdf", pdf("Penalty applies after the due date"))).toContain("Penalty applies after the due date");
  });

  it("explains a PDF with no text layer", async () => {
    await expect(extractRequirementText("scan.pdf", pdf(null))).rejects.toThrow(/scanned PDF/);
  });

  it("rejects damaged files with a readable message", async () => {
    await expect(extractRequirementText("bad.docx", strToU8("not a zip"))).rejects.toThrow(/couldn't be read/);
    await expect(extractRequirementText("bad.pdf", strToU8("not a pdf"))).rejects.toThrow(/couldn't be opened/);
  });

  it("rejects unsupported, empty and oversized files", async () => {
    await expect(extractRequirementText("rule.exe", strToU8("x"))).rejects.toThrow(/Unsupported file type ".exe"/);
    await expect(extractRequirementText("rule", strToU8("x"))).rejects.toThrow(/Unsupported file type "none"/);
    await expect(extractRequirementText("rule.md", new Uint8Array())).rejects.toThrow(/empty/);
    await expect(extractRequirementText("rule.md", new Uint8Array(MAX_FILE_BYTES + 1))).rejects.toThrow(/larger than 5 MB/);
    await expect(extractRequirementText("rule.md", strToU8("   \n\n "))).rejects.toThrow(/no text/);
    await expect(extractRequirementText("rule.md", strToU8("a".repeat(MAX_TEXT_CHARS + 1)))).rejects.toThrow(/limit is 60,000/);
  });
});
