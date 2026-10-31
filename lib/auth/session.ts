import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions } from "./cookie";
import { can, type Action, type Role } from "./permissions";
import { createRateLimiter } from "./rate-limit";
import { authStore, type SessionUser } from "./store";

// The Data Access Layer for auth: every page, Server Action and route handler checks the session through here.
// proxy.ts only does an optimistic redirect when the cookie is missing.

export const auth = authStore(db);

/** 5 failed logins per email per 15 minutes. */
export const loginLimiter = createRateLimiter(db, { name: "login", max: 5, windowMs: 15 * 60 * 1000 });

/** 20 sign-up requests per hour in total, so a script can't flood the approval list. */
export const signupLimiter = createRateLimiter(db, { name: "signup", max: 20, windowMs: 60 * 60 * 1000 });

/** Forgot-password requests: 5 per email and 30 in total per hour, so nobody can flood the admin's list. */
export const resetLimiter = createRateLimiter(db, { name: "reset", max: 5, windowMs: 60 * 60 * 1000 });
export const resetAllLimiter = createRateLimiter(db, { name: "reset-all", max: 30, windowMs: 60 * 60 * 1000 });

/** The signed-in user, or null. Read once per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks compare against the clock, so tell Cache Components this render is request-time.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? auth.resolveSession(token) : null;
});

/**
 * Redirects to /login when signed out and to /account while a temporary password is still set.
 * A signed-in user without one of `roles` gets a 404, so hidden pages don't reveal that they exist.
 */
export async function requireUser(roles?: readonly Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/account");
  if (roles && !roles.includes(user.role)) notFound();
  return user;
}

export async function requireAction(action: Action): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, action)) notFound();
  return user;
}

export async function signIn(userId: string) {
  const { token } = await auth.createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await auth.deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

export async function currentToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
