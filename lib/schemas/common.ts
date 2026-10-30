import { z } from "zod";

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
