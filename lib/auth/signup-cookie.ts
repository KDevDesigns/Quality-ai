// The cookie that lets the browser which sent a sign-up request get its temporary password once an admin approves it
// (lib/auth/store.ts claimTempPassword). It holds a random secret; the server stores only its hash. HTTP-only, so page
// scripts can't read it; kept 30 days, which is plenty of time for an admin to approve.

export const SIGNUP_COOKIE = "qahub_signup";

export const signupCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60,
};
