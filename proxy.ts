import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookie";

// Optimistic check only: no cookie → /login. The real session check is requireUser() in every page, action and route.
// While a cookie is present its expiry is pushed forward, so people who use the app daily stay signed in.

export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    const path = req.nextUrl.pathname + req.nextUrl.search;
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

// Skips the sign-in page, Next's assets and the static images in public/ (the seal must load before sign-in).
// Also skips /api/cron, which Vercel Cron calls without a cookie; that route checks CRON_SECRET itself.
// Ticket files are never in public/; they go through an auth-checked route (CLAUDE.md rule 4).
// The service worker and the manifest hold no data and must load as-is, never as a redirect to /login.
// /share-target checks the session itself: a redirect here would send a shared file's POST to the sign-in page.
export const config = {
  matcher: ["/((?!login|share-target|api/cron|_next/static|_next/image|favicon.ico|sw\\.js$|manifest\\.webmanifest$|.*\\.(?:png|svg|ico)$).*)"],
};
