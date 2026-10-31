"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next";
import { auth, loginLimiter, resetAllLimiter, resetLimiter, signIn, signOut, signupLimiter } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/store";
import { fromZodError, text, type FormState } from "@/lib/form";
import { forgotInput, loginInput, signupInput } from "@/lib/schemas/user";

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

  // Saying so when the email is taken helps the team more than hiding which emails have accounts (an admin's choice);
  // the rate limit above still stops anyone checking emails in bulk.
  const result = await auth.signUp(parsed.data);
  if (result === "exists") return emailError("This email already has an account. Sign in, or use Forgot password.");
  if (result === "pending") return emailError("A request for this email is already waiting for an admin's approval.");
  return { ok: true };
}

/** Forgot password: no email is sent. The request waits in Admin → Users, and the admin hands over a temporary password. */
export async function requestPasswordReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotInput.safeParse({ email: text(fd, "email") });
  if (!parsed.success) return fromZodError(parsed.error);

  const key = parsed.data.email;
  if ((await resetLimiter.blockedFor(key)) || (await resetAllLimiter.blockedFor("all"))) {
    return { ok: false, message: "Too many requests right now. Try again later, or ask a QA Hub admin." };
  }
  await resetLimiter.fail(key);
  await resetAllLimiter.fail("all");

  const result = await auth.requestReset(parsed.data.email);
  if (result === "unknown") return emailError("No account uses this email. Request one under Sign up.");
  if (result === "pending") return emailError("This account is still waiting for an admin's approval.");
  if (result === "inactive") return emailError("This account is turned off. Ask a QA Hub admin.");
  return { ok: true };
}

const emailError = (message: string): FormState => ({ ok: false, message: "Please fix the highlighted fields.", fieldErrors: { email: [message] } });

export async function logout() {
  await signOut();
  redirect("/login");
}
