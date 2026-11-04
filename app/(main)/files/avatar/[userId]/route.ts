import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { avatarStore } from "@/lib/users/avatar";
import { signedReadUrl } from "@/lib/uploads/storage";

// Profile photos, for anyone signed in: unlike a ticket's files they belong to no ticket, because everyone sees everyone's in
// conversations. Like them, the answer is a redirect to a short-lived signed Storage URL (CLAUDE.md rule 4).

/** Under the signed URL's hour. The address changes with a new photo, so nobody keeps seeing the old one. */
const AVATAR_REDIRECT_CACHE_S = 50 * 60;

/** GET /files/avatar/[userId] — one person's profile photo. */
export async function GET(_req: Request, { params }: RouteContext<"/files/avatar/[userId]">) {
  await connection();
  const { userId } = await params;
  const user = await getCurrentUser();
  // On a temporary password someone can reach only their own account page, so only their own photo.
  if (!user || (user.mustChangePassword && user.id !== userId)) return new Response("Sign in to view this file.", { status: 401 });

  const file = await avatarStore(db).fileOf(userId);
  if (!file) return new Response("File not found.", { status: 404 });

  const url = await signedReadUrl(file);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": `private, max-age=${AVATAR_REDIRECT_CACHE_S}` } });
}
