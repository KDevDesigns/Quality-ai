// Shared by lib/auth/session.ts and proxy.ts; kept free of the database so the proxy stays light.

export const SESSION_COOKIE = "qa_session";

/** Matches SESSION_TTL_MS in ./store; the proxy pushes the cookie expiry forward on every visit. */
export const SESSION_MAX_AGE_S = 14 * 24 * 60 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // Plain HTTP on the LAN until IT provides a certificate; set COOKIE_SECURE=1 once the app is served over HTTPS.
    secure: process.env.COOKIE_SECURE === "1",
    maxAge: SESSION_MAX_AGE_S,
  };
}
