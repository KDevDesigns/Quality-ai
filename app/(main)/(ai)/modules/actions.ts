"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, text, type FormState } from "@/lib/form";
import { id, optionalText } from "@/lib/schemas/common";
import { requireAiWorkbench } from "@/lib/workspace";

const moduleUpdate = z.object({ id, description: optionalText() });

export async function updateModule(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAiWorkbench();
  const parsed = moduleUpdate.safeParse({ id: text(fd, "id"), description: text(fd, "description") });
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await db.module.update({ where: { id: parsed.data.id }, data: { description: parsed.data.description } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
