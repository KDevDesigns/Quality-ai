"use server";

import { revalidatePath } from "next/cache";
import { requireAction } from "@/lib/auth/session";
import type { FormState } from "@/lib/form";
import { saveWorkspaceSettings } from "@/lib/workspace";

export async function saveWorkspace(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAction("workspace.manage");
  await saveWorkspaceSettings({ aiWorkbench: fd.get("aiWorkbench") === "on" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}
