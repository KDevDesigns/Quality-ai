import { z } from "zod";

export const MODULE_CODES = ["BILLING", "P2P", "FINANCE", "HR"] as const;
export type ModuleCodeValue = (typeof MODULE_CODES)[number];

export const MODULE_LABELS: Record<ModuleCodeValue, string> = {
  BILLING: "Billing & Collection",
  P2P: "Procurement & Inventory",
  FINANCE: "Finance & Accounting",
  HR: "HR & Payroll",
};

export const id = z.string().trim().min(1, "Required");

/** Empty form fields become null so optional columns are cleared rather than set to "". */
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
