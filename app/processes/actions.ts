"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, jsonField, text, type FormState } from "@/lib/form";
import { processInput } from "@/lib/schemas/process";

export async function saveProcess(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = processInput.safeParse({
    moduleId: text(fd, "moduleId"),
    name: text(fd, "name"),
    description: text(fd, "description"),
    steps: jsonField(fd, "steps"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = text(fd, "id");
  try {
    if (id) await db.businessProcess.update({ where: { id }, data: parsed.data });
    else await db.businessProcess.create({ data: parsed.data });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProcess(id: string): Promise<FormState> {
  try {
    await db.businessProcess.delete({ where: { id } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
