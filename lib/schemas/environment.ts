import { z } from "zod";
import { validateBaseUrl } from "@/lib/guard/allowlist";
import { id, optionalText } from "./common";

const baseUrl = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    const r = validateBaseUrl(v);
    if (!r.ok) ctx.addIssue({ code: "custom", message: r.reason });
  });

/** Normalizes via URL so "https://ERP.local/" and "https://erp.local" dedupe to one entry. */
function normalizeBase(v: string): string {
  const u = new URL(v);
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "";
  return u.origin + path;
}

export const baseUrlList = z
  .array(baseUrl)
  .min(1, "At least one base URL is required")
  .transform((list) => [...new Set(list.map(normalizeBase))]);

export const environmentInput = z.object({
  projectId: id,
  name: z.string().trim().min(1, "Name is required").max(60),
  baseUrls: baseUrlList,
  apiBaseUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .pipe(z.union([z.null(), baseUrl.transform(normalizeBase)])),
  dbConnRef: optionalText(80).pipe(
    z.union([
      z.null(),
      z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Use the NAME of an env var in .env.local (e.g. ERP_STAGING_DB_URL), not the connection string"),
    ]),
  ),
  isProduction: z.boolean(),
  notes: optionalText(),
});

export type EnvironmentInput = z.infer<typeof environmentInput>;

/** Reads a stored Json column back into a string[]; anything malformed yields an empty list (which the guard rejects). */
export function readBaseUrls(json: unknown): string[] {
  const r = z.array(z.string()).safeParse(json);
  return r.success ? r.data : [];
}
