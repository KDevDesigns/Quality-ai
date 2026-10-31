import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { ticketStore } from "@/lib/tickets/store";
import { signedReadUrl } from "@/lib/uploads/storage";

// Ticket attachments are only ever reached through here, after a session and ticket-scope check (CLAUDE.md rule 4).
// The answer is a redirect to a short-lived signed Storage URL, so files never pass through a Vercel function, and
// Storage answers the Range requests that let a video be scrubbed.

/** GET /files/[id] — one ticket attachment, for someone who may see its ticket. */
export async function GET(_req: Request, { params }: RouteContext<"/files/[id]">) {
  await connection();
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !can(user, "tickets.view")) return new Response("Sign in to view this file.", { status: 401 });

  const { id } = await params;
  // Only files on tickets this person may see; anything else looks like it doesn't exist.
  const file = await ticketStore(db).attachmentFor(user, id);
  if (!file) return new Response("File not found.", { status: 404 });

  const url = await signedReadUrl(file.storedName);
  // Not cached: each visit re-checks access and gets a fresh URL.
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
}
