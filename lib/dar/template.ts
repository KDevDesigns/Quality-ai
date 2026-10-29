// The fixed text of a DAR: an admin-set template (Setting "dar.template"), with each tester's own overrides
// (DarProfile) on top. Stored JSON that no longer matches falls back to the defaults instead of breaking the page.

import { z } from "zod";

const line = (max: number) => z.string().trim().max(max);

export const darFunction = z.object({
  duty: line(1000).min(1, "Describe the duty."),
  mfo: line(1000).default(""),
  /** This row gets the day-by-day entries filled from ticket activity. */
  autofill: z.boolean().default(false),
});
export type DarFunction = z.infer<typeof darFunction>;

const signatory = z.object({ name: line(120).default(""), title: line(160).default("") });

export const darTemplate = z.object({
  position: line(120).default("System Analyst"),
  department: line(160).default("Information and Communication Technology Department"),
  unit: line(160).default("Data Management Unit"),
  /** Immediate supervisor; also signs "Confirmed by". */
  confirmedBy: signatory.default({ name: "Verlie S. Tuyor", title: "OIC, Data Management Unit" }),
  notedBy: signatory.default({ name: "Engr. Anne Michelle S. Buagas", title: "Manager, Information and Communication Technology Department" }),
  coreFunctions: z.array(darFunction).max(10).default([
    {
      duty:
        "Performs API testing, automation testing, and performance validation for ERP system (HR, Procurement (BUR), Property and Supply Management System (PSMS), Project Monitoring System (PrMS), DCWD Mobile Application and Leak Alert), including data validation, defect identification, and test documentation.",
      mfo: [
        "• Gathering information of End-Users (PSMS)",
        "• Performs documentation and test reports",
        "• Create Test Cases for (ERP) Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert",
        "• Evaluated system speed, stability, and response using K-6 automation",
        "• Verified API's function correctly and meet requirements",
      ].join("\n"),
      autofill: true,
    },
  ]),
  supportFunctions: z.array(darFunction).max(10).default([
    {
      duty: "Assist in the accurate encoding of data submitted by end-users.",
      mfo: "Data entries on ERP (HR, Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert)",
      autofill: false,
    },
    {
      duty: "Reviews entered data for integrity, accuracy, completeness, and consistency on ERP (HR, PROCUREMENT (BUR), PSMS, PrMS, DCWD MOBILE APP and LEAK ALERT)",
      mfo: "Data entries on ERP (HR, Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert) has been correctly evaluated",
      autofill: true,
    },
    { duty: "Perform other related functions as may be required by the immediate supervisor", mfo: "Accomplishment Report", autofill: false },
  ]),
});
export type DarTemplate = z.infer<typeof darTemplate>;

export function readDarTemplate(value: unknown): DarTemplate {
  const r = darTemplate.safeParse(value ?? {});
  return r.success ? r.data : darTemplate.parse({});
}

/** A tester's overrides. Empty or missing means "use the template". */
export const darProfileInput = z.object({
  fullName: line(120),
  position: line(120),
  coreFunctions: z.array(darFunction).max(10).nullable(),
  supportFunctions: z.array(darFunction).max(10).nullable(),
});
export type DarProfileInput = z.infer<typeof darProfileInput>;

export type DarProfileRow = { fullName: string | null; position: string | null; coreFunctions: unknown; supportFunctions: unknown } | null;

const functions = (v: unknown): DarFunction[] | null => {
  const r = z.array(darFunction).max(10).safeParse(v);
  return r.success && r.data.length ? r.data : null;
};

export type DarHeader = {
  name: string;
  position: string;
  department: string;
  unit: string;
  supervisor: string;
  confirmedBy: { name: string; title: string };
  notedBy: { name: string; title: string };
  core: DarFunction[];
  support: DarFunction[];
};

/** The header and functions as they appear on the report: the tester's overrides, else the template. */
export function resolveHeader(t: DarTemplate, profile: DarProfileRow, user: { name: string }): DarHeader {
  return {
    name: profile?.fullName?.trim() || user.name,
    position: profile?.position?.trim() || t.position,
    department: t.department,
    unit: t.unit,
    supervisor: t.confirmedBy.name,
    confirmedBy: t.confirmedBy,
    notedBy: t.notedBy,
    core: functions(profile?.coreFunctions) ?? t.coreFunctions,
    support: functions(profile?.supportFunctions) ?? t.supportFunctions,
  };
}

/** "Reuben John F. Lisondra" → "RJFL", as in the report file names. */
export function nameInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0] ?? "")
    .join("")
    .toUpperCase();
}
