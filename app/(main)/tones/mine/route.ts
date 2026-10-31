import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pushStore } from "@/lib/push/store";
import { signedReadUrl } from "@/lib/uploads/storage";

// A person's own notification tone, reached only through here after a session check (CLAUDE.md rule 4). Each person
// can only ever get their own: there's no id in the URL to change.

/** GET /tones/mine — the signed-in person's uploaded tone. */
export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in to play this sound.", { status: 401 });

  const storedName = await pushStore(db).customToneName(user.id);
  if (!storedName) return new Response("No sound uploaded.", { status: 404 });

  const url = await signedReadUrl(storedName, { expiresIn: 5 * 60 });
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
}
