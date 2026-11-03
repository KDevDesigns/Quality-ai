"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/lib/auth/session";
import type { DarCells } from "@/lib/dar/autofill";
import { darStore } from "@/lib/dar/store";
import { parsePeriod } from "@/lib/dar/period";
import { darProfileInput } from "@/lib/dar/template";
import { db } from "@/lib/db";
import { fromZodError, jsonField, text, type FormState } from "@/lib/form";

const dar = darStore(db);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Saves the day cells and date submitted. Only ever the signed-in person's own report. */
export async function saveDar(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("dar.use");
  const period = parsePeriod(text(fd, "period"));
  if (!period) return { ok: false, message: "That period isn't valid. Pick one from the list." };
  const dateSubmitted = text(fd, "dateSubmitted");
  if (!DATE.test(dateSubmitted)) return { ok: false, message: "Pick the date submitted." };
  await dar.save(me, period, jsonField(fd, "cells"), dateSubmitted);
  revalidatePath("/dar");
  return { ok: true, message: "Saved." };
}

/** Re-fills the rows marked "fill from my ticket work"; the other rows keep what was typed. */
export async function refillDar(_prev: FormState, fd: FormData): Promise<FormState & { cells?: DarCells }> {
  const me = await requireAction("dar.use");
  const period = parsePeriod(text(fd, "period"));
  if (!period) return { ok: false, message: "That period isn't valid. Pick one from the list." };
  const cells = await dar.refill(me, period);
  revalidatePath("/dar");
  return { ok: true, message: "Filled in again from your ticket work.", cells };
}

/** My details: everything fixed on the person's own report, used for every period. */
export async function saveDarProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("dar.use");
  const parsed = darProfileInput.safeParse({
    fullName: text(fd, "fullName"),
    position: text(fd, "position"),
    department: text(fd, "department"),
    unit: text(fd, "unit"),
    confirmedBy: { name: text(fd, "confirmedName"), title: text(fd, "confirmedTitle") },
    notedBy: { name: text(fd, "notedName"), title: text(fd, "notedTitle") },
    coreFunctions: jsonField(fd, "coreFunctions") ?? [],
    supportFunctions: jsonField(fd, "supportFunctions") ?? [],
    firstPeriodStart: text(fd, "firstPeriodStart"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  await dar.saveProfile(me.id, parsed.data);
  revalidatePath("/dar");
  revalidatePath("/dar/setup");
  return { ok: true, message: "Saved. Your DAR uses it from now on." };
}
