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

/** Saves the day cells and date submitted. Only ever the signed-in tester's own report. */
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

export async function saveDarProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("dar.use");
  const own = fd.get("useTemplate") !== "on";
  const parsed = darProfileInput.safeParse({
    fullName: text(fd, "fullName"),
    position: text(fd, "position"),
    coreFunctions: own ? jsonField(fd, "coreFunctions") : null,
    supportFunctions: own ? jsonField(fd, "supportFunctions") : null,
  });
  if (!parsed.success) return fromZodError(parsed.error);
  await dar.saveProfile(me.id, parsed.data);
  revalidatePath("/dar");
  return { ok: true, message: "Saved." };
}
