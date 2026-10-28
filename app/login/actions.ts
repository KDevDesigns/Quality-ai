"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next";
import { auth, loginLimiter, signIn, signOut } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/store";
import { fromZodError, text, type FormState } from "@/lib/form";
import { loginInput } from "@/lib/schemas/user";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginInput.safeParse({ email: text(fd, "email"), password: text(fd, "password") });
  if (!parsed.success) return fromZodError(parsed.error);

  const key = normalizeEmail(parsed.data.email);
  const wait = loginLimiter.blockedFor(key);
  if (wait) return { ok: false, message: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? "s" : ""}.` };

  const user = await auth.checkCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    loginLimiter.fail(key);
    // One message for every failure, so the form doesn't reveal which emails have accounts.
    return { ok: false, message: "Wrong email or password, or the account is turned off." };
  }
  loginLimiter.reset(key);
  await signIn(user.id);
  redirect(user.mustChangePassword ? "/account" : safeNext(text(fd, "next")));
}

export async function logout() {
  await signOut();
  redirect("/login");
}
