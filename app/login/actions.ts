"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateTempPassword } from "@/lib/auth/password";
import { safeNext } from "@/lib/auth/safe-next";
import { auth, loginLimiter, resetAllLimiter, resetLimiter, signIn, signOut, signupLimiter } from "@/lib/auth/session";
import { SIGNUP_COOKIE, signupCookieOptions } from "@/lib/auth/signup-cookie";
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
  // Signing in ends any sign-up request this account had, and this browser forgets it, so a later person on a shared
  // computer can't make a new temporary password for it.
  await auth.endClaim(user.id);
  const jar = await cookies();
  const held = jar.get(SIGNUP_COOKIE)?.value;
  // Only when the cookie was theirs (or is stale): someone else's waiting request on a shared computer stays.
  if (held && !(await auth.claimStatus(held))) jar.delete(SIGNUP_COOKIE);
  await signIn(user.id);
  redirect(user.mustChangePassword ? "/account" : safeNext(text(fd, "next")));
}

/** `again`: this browser already has a request for this email (waiting, or approved and ready for a password). */
export type SignupState = FormState & { again?: "waiting" | "approved" };

export async function signup(_prev: SignupState, fd: FormData): Promise<SignupState> {
  const parsed = signupInput.safeParse({
    role: text(fd, "role"),
    name: text(fd, "name"),
    email: text(fd, "email"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  if (await signupLimiter.blockedFor("all")) return { ok: false, message: "Too many sign-ups right now. Try again later, or ask a QA Hub admin." };
  await signupLimiter.fail("all");

  const jar = await cookies();
  const held = jar.get(SIGNUP_COOKIE)?.value;
  // Saying so when the email is taken helps the team more than hiding which emails have accounts (an admin's choice);
  // the rate limit above still stops anyone checking emails in bulk. Signing up again for a taken email only works from
  // the browser that made the request, so nobody else can get that account's temporary password.
  const { result, secret, busyEmail } = await auth.signUp(parsed.data, held);
  if (result === "busy") return emailError(`This browser already has a request for ${busyEmail}. Wait for it, or ask a QA Hub admin to reject it first.`);
  if (result === "exists") return emailError("This email already has an account. Sign in, or use Forgot password.");
  if (result === "pending") return emailError("A request for this email is already waiting for an admin's approval.");
  if (secret) jar.set(SIGNUP_COOKIE, secret, signupCookieOptions);
  const status = result === "again" && secret ? await auth.claimStatus(secret) : null;
  return { ok: true, again: status?.state };
}

/** What the sign-in page shows this browser about its sign-up request, if it made one. */
export async function signupStatus() {
  const secret = (await cookies()).get(SIGNUP_COOKIE)?.value;
  return secret ? auth.claimStatus(secret) : null;
}

export type ClaimState = { ok: boolean; message?: string; tempPassword?: string; email?: string };

/**
 * "Show my temporary password": only for the browser holding an approved request's cookie, at most once a minute. Each
 * time makes a new one, which replaces the last.
 */
export async function claimTempPassword(): Promise<ClaimState> {
  const secret = (await cookies()).get(SIGNUP_COOKIE)?.value;
  const r = secret ? await auth.claimTempPassword(secret, () => generateTempPassword()) : null;
  if (!r) return { ok: false, message: "There is no approved request on this browser. Sign up again, or ask a QA Hub admin." };
  if ("waitSeconds" in r) return { ok: false, message: `You can get a new temporary password in ${r.waitSeconds} second${r.waitSeconds === 1 ? "" : "s"}.` };
  return { ok: true, tempPassword: r.tempPassword, email: r.email };
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
