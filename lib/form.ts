import { z } from "zod";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { ok: false };

export function fromZodError(error: z.ZodError): FormState {
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(error).fieldErrors };
}

/** Maps known Prisma error codes to messages a user can act on; anything else is rethrown. */
export function fromDbError(e: unknown): FormState {
  const code = (e as { code?: unknown } | null)?.code;
  if (code === "P2002") return { ok: false, message: "A record with that name already exists." };
  if (code === "P2003") return { ok: false, message: "This record is still referenced by other records and cannot be removed." };
  if (code === "P2025") return { ok: false, message: "The record no longer exists. Refresh the page." };
  throw e;
}

export function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function lines(fd: FormData, key: string): string[] {
  return text(fd, key)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function jsonField(fd: FormData, key: string): unknown {
  try {
    return JSON.parse(text(fd, key) || "null");
  } catch {
    return null;
  }
}
