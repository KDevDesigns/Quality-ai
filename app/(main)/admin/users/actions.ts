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

  // A pending sign-up has no usable password yet, so it is turned on only through Approve, which creates one.
  const target = await db.user.findUnique({ where: { id }, select: { pending: true } });
  if (target?.pending && parsed.data.active) return { ok: false, message: "Use Approve in the list above. It creates their temporary password." };

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

/** Approves a sign-up and returns its one-time temporary password for the admin to hand over. */
export async function approveSignUp(id: string): Promise<UserFormState> {
  await requireAction("users.manage");
  const user = await db.user.findUnique({ where: { id }, select: { email: true } });
  const tempPassword = generateTempPassword();
  if (!user || !(await auth.approveSignUp(id, tempPassword))) return { ok: false, message: "This request was already handled. Refresh the page." };
  // No revalidatePath here: refreshing now would remove the request's row, and the dialog showing the password with it.
  // The dialog refreshes the page when the admin closes it.
  return { ok: true, tempPassword, email: user.email };
}

export async function rejectSignUp(id: string): Promise<FormState> {
  await requireAction("users.manage");
  if (!(await auth.rejectSignUp(id))) return { ok: false, message: "This request was already handled. Refresh the page." };
  revalidatePath("/admin/users");
  revalidatePath("/");
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
  await auth.clearResetRequest(id);
  // No revalidatePath, like approveSignUp: the dialog showing the password refreshes the page when it closes.
  return { ok: true, tempPassword, email: user.email };
}

/** Removes a forgot-password request without resetting, e.g. when the person remembered their password. */
export async function dismissResetRequest(id: string): Promise<FormState> {
  await requireAction("users.manage");
  if (!(await auth.clearResetRequest(id))) return { ok: false, message: "This request was already handled. Refresh the page." };
  revalidatePath("/admin/users");
  revalidatePath("/");
  return { ok: true };
}
