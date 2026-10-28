import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/store";
import { db } from "@/lib/db";
import { readWorkspaceSettings, workspaceSettings, type WorkspaceSettings } from "@/lib/schemas/workspace";

const KEY = "workspace";

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  return readWorkspaceSettings(row?.value);
}

export async function saveWorkspaceSettings(patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  const next = workspaceSettings.parse({ ...(await getWorkspaceSettings()), ...patch });
  await db.setting.upsert({ where: { key: KEY }, update: { value: next }, create: { key: KEY, value: next } });
  return next;
}

/** Admins only, and only while the AI workbench is switched on. Everyone else gets a 404. */
export async function requireAiWorkbench(): Promise<SessionUser> {
  const user = await requireUser(["ADMIN"]);
  if (!(await getWorkspaceSettings()).aiWorkbench) notFound();
  return user;
}

/** For route handlers, which answer with a status code instead of redirecting. */
export async function aiWorkbenchAllowed(user: SessionUser | null): Promise<boolean> {
  return !!user && user.role === "ADMIN" && !user.mustChangePassword && (await getWorkspaceSettings()).aiWorkbench;
}
