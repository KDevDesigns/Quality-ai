import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// Share → QA Hub normally stops in the service worker (public/sw.js) and never reaches here. This is for the rare time it isn't
// running: the file can't be kept, so the person lands on New ticket with a note to add it again. Nothing is read or stored.

async function missed(req: NextRequest) {
  const url = (await getCurrentUser()) ? "/tickets/new?shared=missed" : "/login?next=%2Ftickets%2Fnew%3Fshared%3Dmissed";
  return NextResponse.redirect(new URL(url, req.url), 303);
}

export const POST = missed;
export const GET = missed;
