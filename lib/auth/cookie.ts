// Shared by lib/auth/session.ts and proxy.ts; kept free of the database so the proxy stays light.

export const SESSION_COOKIE = "qa_session";

/** Matches SESSION_TTL_MS in ./store; the proxy pushes the cookie expiry forward on every visit. */
export const SESSION_MAX_AGE_S = 14 * 24 * 60 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // Vercel serves HTTPS only. `next dev` runs on plain http://localhost, where a secure cookie would be dropped.
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_S,
  };
}
