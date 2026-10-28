"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, lines, text, type FormState } from "@/lib/form";
import { isUrlAllowed, type GuardResult } from "@/lib/guard/allowlist";
import { environmentInput, readBaseUrls } from "@/lib/schemas/environment";
import { requireAiWorkbench } from "@/lib/workspace";

export async function saveEnvironment(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAiWorkbench();
  const parsed = environmentInput.safeParse({
    projectId: text(fd, "projectId"),
    name: text(fd, "name"),
    baseUrls: lines(fd, "baseUrls"),
    apiBaseUrl: text(fd, "apiBaseUrl"),
    dbConnRef: text(fd, "dbConnRef"),
    isProduction: fd.get("isProduction") === "on",
    notes: text(fd, "notes"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = text(fd, "id");
  try {
    if (id) {
      const current = await db.environment.findUniqueOrThrow({ where: { id } });
      // Un-marking production is the one edit that could expose prod to runs, so require typing the name.
      if (current.isProduction && !parsed.data.isProduction && text(fd, "confirmUnprotect").trim() !== current.name) {
        return {
          ok: false,
          message: `To remove the production flag, type "${current.name}" in the confirmation box.`,
          fieldErrors: { confirmUnprotect: ["Name does not match."] },
        };
      }
      await db.environment.update({ where: { id }, data: parsed.data });
    } else {
      await db.environment.create({ data: parsed.data });
    }
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEnvironment(id: string): Promise<FormState> {
  await requireAiWorkbench();
  try {
    await db.environment.delete({ where: { id } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Runs the real guard against the stored environment, so what you see is what the runner will enforce. */
export async function checkUrl(envId: string, url: string): Promise<GuardResult> {
  await requireAiWorkbench();
  const env = await db.environment.findUnique({ where: { id: envId } });
  if (!env) return { ok: false, reason: "Environment not found." };
  return isUrlAllowed(url, {
    name: env.name,
    isProduction: env.isProduction,
    baseUrls: readBaseUrls(env.baseUrls),
    apiBaseUrl: env.apiBaseUrl,
  });
}
