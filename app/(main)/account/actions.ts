"use server";

import { redirect } from "next/navigation";
import { auth, currentToken, getCurrentUser } from "@/lib/auth/session";
import { fromZodError, text, type FormState } from "@/lib/form";
import { passwordChangeInput } from "@/lib/schemas/user";

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  // getCurrentUser, not requireUser: people with a temporary password must be able to reach this action.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = passwordChangeInput.safeParse({ current: text(fd, "current"), next: text(fd, "next"), confirm: text(fd, "confirm") });
  if (!parsed.success) return fromZodError(parsed.error);
  if (!(await auth.verifyUserPassword(user.id, parsed.data.current))) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { current: ["That isn't your current password"] } };
  }

  await auth.setPassword(user.id, parsed.data.next, false);
  await auth.deleteUserSessions(user.id, await currentToken());
  redirect("/");
}
