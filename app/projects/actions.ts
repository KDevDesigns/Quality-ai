"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, text, type FormState } from "@/lib/form";
import { projectInput } from "@/lib/schemas/project";

export async function saveProject(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = projectInput.safeParse({ name: text(fd, "name"), description: text(fd, "description") });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = text(fd, "id");
  try {
    if (id) await db.project.update({ where: { id }, data: parsed.data });
    else await db.project.create({ data: parsed.data });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<FormState> {
  try {
    await db.project.delete({ where: { id } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
