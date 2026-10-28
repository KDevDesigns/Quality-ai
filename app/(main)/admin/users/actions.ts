"use server";

import { revalidatePath } from "next/cache";
import { generateTempPassword } from "@/lib/auth/password";
import { auth, requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, text, type FormState } from "@/lib/form";
import { userInput, userUpdateInput } from "@/lib/schemas/user";

/** The temporary password is returned once, shown to the admin, and never stored in plain text. */
export type UserFormState = FormState & { tempPassword?: string; email?: string };

function duplicateEmail(e: unknown): UserFormState | null {
  return (e as { code?: unknown } | null)?.code === "P2002"
    ? { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { email: ["Another account already uses this email"] } }
    : null;
}

export async function createUser(_prev: UserFormState, fd: FormData): Promise<UserFormState> {
  await requireAction("users.manage");
  const parsed = userInput.safeParse({ name: text(fd, "name"), email: text(fd, "email"), role: text(fd, "role") });
  if (!parsed.success) return fromZodError(parsed.error);

  const tempPassword = generateTempPassword();
  try {
    await auth.createUser({ ...parsed.data, password: tempPassword });
  } catch (e) {
    return duplicateEmail(e) ?? fromDbError(e);
  }
  revalidatePath("/admin/users");
  revalidatePath("/team");
  return { ok: true, tempPassword, email: parsed.data.email };
}

export async function updateUser(_prev: UserFormState, fd: FormData): Promise<UserFormState> {
  const me = await requireAction("users.manage");
  const id = text(fd, "id");
  const parsed = userUpdateInput.safeParse({ name: text(fd, "name"), email: text(fd, "email"), role: text(fd, "role"), active: fd.get("active") === "on" });
  if (!parsed.success) return fromZodError(parsed.error);

  if (id === me.id && !parsed.data.active) return { ok: false, message: "You can't turn off your own account." };
  if (await auth.wouldRemoveLastAdmin(id, parsed.data)) return { ok: false, message: "Keep at least one active admin, or nobody can manage users." };

  try {
    await db.user.update({ where: { id }, data: parsed.data });
  } catch (e) {
    return duplicateEmail(e) ?? fromDbError(e);
  }
  if (!parsed.data.active) await auth.deleteUserSessions(id);
  revalidatePath("/admin/users");
  revalidatePath("/team");
  return { ok: true };
}

export async function resetPassword(id: string): Promise<UserFormState> {
  const me = await requireAction("users.manage");
  if (id === me.id) return { ok: false, message: "Change your own password in My account." };
  const user = await db.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return { ok: false, message: "The user no longer exists. Refresh the page." };

  const tempPassword = generateTempPassword();
  await auth.setPassword(id, tempPassword, true);
  await auth.deleteUserSessions(id);
  revalidatePath("/admin/users");
  return { ok: true, tempPassword, email: user.email };
}
