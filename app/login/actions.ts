"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next";
import { auth, loginLimiter, signIn, signOut, signupLimiter } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/store";
import { fromZodError, text, type FormState } from "@/lib/form";
import { loginInput, signupInput } from "@/lib/schemas/user";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginInput.safeParse({ email: text(fd, "email"), password: text(fd, "password") });
  if (!parsed.success) return fromZodError(parsed.error);

  const key = normalizeEmail(parsed.data.email);
  const wait = await loginLimiter.blockedFor(key);
  if (wait) return { ok: false, message: `Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? "s" : ""}.` };

  const user = await auth.checkCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    await loginLimiter.fail(key);
    // One message for every failure, so the form doesn't reveal which emails have accounts.
    return { ok: false, message: "Wrong email or password, or the account is turned off." };
  }
  await loginLimiter.reset(key);
  await signIn(user.id);
  redirect(user.mustChangePassword ? "/account" : safeNext(text(fd, "next")));
}

export async function signup(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupInput.safeParse({
    role: text(fd, "role"),
    name: text(fd, "name"),
    email: text(fd, "email"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  if (await signupLimiter.blockedFor("all")) return { ok: false, message: "Too many sign-ups right now. Try again later, or ask a QA Hub admin." };
  await signupLimiter.fail("all");

  // The same answer whether or not the email already has an account, so the form can't be used to look people up.
  await auth.signUp(parsed.data);
  return { ok: true };
}

export async function logout() {
  await signOut();
  redirect("/login");
}
