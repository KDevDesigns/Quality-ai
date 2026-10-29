"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/lib/auth/session";
import { darStore } from "@/lib/dar/store";
import { darTemplate } from "@/lib/dar/template";
import { db } from "@/lib/db";
import { fromZodError, jsonField, text, type FormState } from "@/lib/form";

const dar = darStore(db);

export async function saveDarTemplate(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAction("dar.template");
  const parsed = darTemplate.safeParse({
    position: text(fd, "position"),
    department: text(fd, "department"),
    unit: text(fd, "unit"),
    confirmedBy: { name: text(fd, "confirmedName"), title: text(fd, "confirmedTitle") },
    notedBy: { name: text(fd, "notedName"), title: text(fd, "notedTitle") },
    coreFunctions: jsonField(fd, "coreFunctions"),
    supportFunctions: jsonField(fd, "supportFunctions"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  await dar.saveTemplate(parsed.data);
  revalidatePath("/admin/dar");
  revalidatePath("/dar");
  return { ok: true, message: "Saved. Testers see it the next time they open My DAR." };
}
