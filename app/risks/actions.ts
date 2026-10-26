"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, text, type FormState } from "@/lib/form";
import { riskScore } from "@/lib/risk/score";
import { riskInput } from "@/lib/schemas/risk";

export async function saveRisk(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = riskInput.safeParse({
    moduleId: text(fd, "moduleId"),
    processId: text(fd, "processId"),
    title: text(fd, "title"),
    characteristic: text(fd, "characteristic"),
    likelihood: text(fd, "likelihood"),
    impact: text(fd, "impact"),
    mitigation: text(fd, "mitigation"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const data = { ...parsed.data, score: riskScore(parsed.data.likelihood, parsed.data.impact) };

  if (data.processId) {
    const proc = await db.businessProcess.findUnique({ where: { id: data.processId }, select: { moduleId: true } });
    if (!proc || proc.moduleId !== data.moduleId) {
      return { ok: false, message: "The selected process belongs to a different module.", fieldErrors: { processId: ["Pick a process from the selected module."] } };
    }
  }

  const id = text(fd, "id");
  try {
    if (id) await db.risk.update({ where: { id }, data });
    else await db.risk.create({ data });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRisk(id: string): Promise<FormState> {
  try {
    await db.risk.delete({ where: { id } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
