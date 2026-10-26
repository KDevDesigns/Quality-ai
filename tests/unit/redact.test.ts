import { describe, expect, it } from "vitest";
import { compileCustomPattern, redact, sanitizeLabel } from "@/lib/ai/redact";

const r = (text: string, opts?: Parameters<typeof redact>[1]) => redact(text, opts).text;

describe("contact details", () => {
  it.each([
    ["email", "Send to juan.delacruz@gmail.com today", "Send to [EMAIL_1] today"],
    ["email with subdomain", "x maria_s+qa@mail.davao-water.gov.ph y", "x [EMAIL_1] y"],
    ["mobile 11 digits", "Call 09171234567", "Call [PHONE_1]"],
    ["mobile dashed", "Call 0917-123-4567.", "Call [PHONE_1]."],
    ["mobile +63 spaced", "Call +63 917 123 4567", "Call [PHONE_1]"],
    ["mobile 63 prefix", "SMS 639171234567 now", "SMS [PHONE_1] now"],
    ["landline with area code in parens", "Tel (082) 221-0021", "Tel [PHONE_1]"],
    ["landline dashed", "Tel 082-221-0021", "Tel [PHONE_1]"],
    ["Manila landline", "Tel (02) 8123-4567", "Tel [PHONE_1]"],
  ])("%s", (_l, input, expected) => {
    expect(r(input)).toBe(expected);
  });
});

describe("government IDs", () => {
  it.each([
    ["TIN unlabeled", "TIN of payee 123-456-789-000", "TIN of payee [TIN_1]"],
    ["TIN 9 digits", "id 123-456-789 here", "id [TIN_1] here"],
    ["TIN labeled", "TIN No. 123456789", "TIN No. [TIN_1]"],
    ["SSS format", "SSS 34-1234567-8", "SSS [GOV_ID_1]"],
    ["PhilHealth format", "PH 12-345678901-2", "PH [GOV_ID_1]"],
    ["Pag-IBIG format", "MID 1234-5678-9012", "MID [GOV_ID_1]"],
    ["GSIS BP labeled", "GSIS BP No. 2004567890", "GSIS BP No. [GOV_ID_1]"],
  ])("%s", (_l, input, expected) => {
    expect(r(input)).toBe(expected);
  });
});

describe("ERP identifiers", () => {
  it.each([
    ["account labeled", "Account No. 1234567 is delinquent", "Account No. [ACCOUNT_1] is delinquent"],
    ["account hash", "Acct #01-234-5678 paid", "Acct #[ACCOUNT_1] paid"],
    ["customer number", "customer number: C-20345 moved", "customer number: [ACCOUNT_1] moved"],
    ["meter labeled", "Meter No. AB123456 replaced", "Meter No. [METER_1] replaced"],
    ["meter serial", "meter serial 9988776 rolled over", "meter serial [METER_1] rolled over"],
    ["OR number", "OR No. 0012345 was voided", "OR No. [OR_1] was voided"],
    ["O.R. with hash", "O.R.#A-778899 issued", "O.R.#[OR_1] issued"],
    ["official receipt", "Official Receipt No. 5551234", "Official Receipt No. [OR_1]"],
  ])("%s", (_l, input, expected) => {
    expect(r(input)).toBe(expected);
  });
});

describe("amounts", () => {
  it.each([
    ["peso sign", "Bill of ₱1,234.56 due", "Bill of [AMOUNT_1] due"],
    ["PHP prefix", "PHP 15,000.00 payroll", "[AMOUNT_1] payroll"],
    ["P prefix", "net pay P12,345.60.", "net pay [AMOUNT_1]."],
    ["pesos suffix", "about 2,500 pesos", "about [AMOUNT_1]"],
  ])("%s", (_l, input, expected) => {
    expect(r(input)).toBe(expected);
  });

  it("can leave amounts in place", () => {
    expect(r("Bill of ₱1,234.56 due", { amounts: false })).toBe("Bill of ₱1,234.56 due");
  });

  it("does not treat the P2P module code as an amount", () => {
    expect(r("P2P suite step 3")).toBe("P2P suite step 3");
  });
});

describe("Filipino names", () => {
  const names = ["Jose Peñaranda", "Juan Dela Cruz", "Ma. Cristina Santos-Ibañez", "Niño Reyes", "Liza Soberano"];

  it.each([
    ["exact with ñ", "Payee Jose Peñaranda", "Payee [NAME_1]"],
    ["uppercase Ñ", "PAYEE JOSE PEÑARANDA", "PAYEE [NAME_1]"],
    ["ñ typed as n", "payee jose penaranda", "payee [NAME_1]"],
    ["surname-first with comma", "Dela Cruz, Juan filed", "[NAME_1] filed"],
    ["surname-first without space", "DELA CRUZ,JUAN", "[NAME_1]"],
    ["abbreviation without period", "Ma Cristina Santos Ibañez approved", "[NAME_1] approved"],
    ["hyphenated with accent dropped", "Ma. Cristina Santos-Ibanez approved", "[NAME_1] approved"],
    ["Niño", "Niño Reyes and Nino Reyes", "[NAME_1] and [NAME_1]"],
    ["inside a sentence with punctuation", "(Liza Soberano).", "([NAME_1])."],
  ])("%s", (_l, input, expected) => {
    expect(r(input, { names })).toBe(expected);
  });

  it("does not match a name inside a longer word", () => {
    expect(r("Joseph Peñarandas", { names: ["Jose Peñaranda"] })).toBe("Joseph Peñarandas");
  });

  it("gives different people different placeholders", () => {
    expect(r("Juan Dela Cruz paid; Liza Soberano did not", { names })).toBe("[NAME_1] paid; [NAME_2] did not");
  });
});

describe("custom patterns", () => {
  it("masks a configured account format with its label", () => {
    const res = redact("acct 01-234-5678-9 billed", { patterns: [{ label: "DCWD acct", pattern: String.raw`\b\d{2}-\d{3}-\d{4}-\d\b` }] });
    expect(res.text).toBe("acct [DCWD_ACCT_1] billed");
    expect(res.findings).toEqual([{ type: "CUSTOM", count: 1 }]);
  });

  it("rejects invalid or empty-matching patterns", () => {
    expect(() => compileCustomPattern({ label: "x", pattern: "(" })).toThrow();
    expect(() => compileCustomPattern({ label: "x", pattern: "a*" })).toThrow(/empty/);
  });

  it("sanitizes labels", () => {
    expect(sanitizeLabel("dcwd acct no.")).toBe("DCWD_ACCT_NO");
    expect(sanitizeLabel("123")).toBe("ID");
  });
});

describe("long numbers", () => {
  it("masks unlabeled digit runs of 7 or more", () => {
    expect(r("ref 20345678 and 1234567")).toBe("ref [NUMBER_1] and [NUMBER_2]");
  });
});

describe("leaves ordinary text alone", () => {
  it.each([
    ["ISO date", "Due on 2026-10-26."],
    ["version number", "Next.js 16.4.3 and Prisma 7.10.1"],
    ["small quantities", "Bill 3 of 12, 450 m3 consumed, 6 digits 123456"],
    ["the word or", "Approve or reject. OR documents are filed or archived."],
    ["module codes", "BILLING P2P FINANCE HR"],
    ["tariff tier text", "Tier 21-30 m3 at rate 45.50 per m3"],
  ])("%s", (_l, input) => {
    expect(redact(input).text).toBe(input);
    expect(redact(input).total).toBe(0);
  });
});

describe("placeholders and mapping", () => {
  it("reuses the same placeholder for a repeated value", () => {
    const res = redact("09171234567 then 0917-123-4567 then 09981112222");
    expect(res.text).toBe("[PHONE_1] then [PHONE_1] then [PHONE_2]");
    expect(res.total).toBe(3);
  });

  it("is idempotent", () => {
    const once = redact("Account No. 1234567, call 09171234567, ₱500.00", { names: ["Juan Dela Cruz"] }).text;
    expect(redact(once, { names: ["Juan Dela Cruz"] }).text).toBe(once);
    expect(redact(once).total).toBe(0);
  });

  it("returns the mapping for in-memory use only", () => {
    const res = redact("Email ana@x.ph");
    expect(res.mapping.get("[EMAIL_1]")).toBe("ana@x.ph");
  });

  it("does not leak state between calls", () => {
    redact("09171234567");
    expect(redact("09981112222").text).toBe("[PHONE_1]");
  });

  it("reports findings in a stable order", () => {
    const res = redact("Juan Dela Cruz, Account No. 1234567, juan@x.ph, 09171234567", { names: ["Juan Dela Cruz"] });
    expect(res.findings.map((f) => f.type)).toEqual(["EMAIL", "ACCOUNT", "PHONE", "NAME"]);
  });

  it("handles a realistic billing note end to end", () => {
    const note =
      "Customer Peñaranda, Jose (Account No. 01-2345-678) disputes OR No. 0098812 for ₱3,450.75. Contact 0917 555 1234 or jose.p@yahoo.com. Meter No. MX445566.";
    const res = redact(note, { names: ["Jose Peñaranda"] });
    expect(res.text).toBe(
      "Customer [NAME_1] (Account No. [ACCOUNT_1]) disputes OR No. [OR_1] for [AMOUNT_1]. Contact [PHONE_1] or [EMAIL_1]. Meter No. [METER_1].",
    );
  });
});
