import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { TicketError, ticketStore } from "@/lib/tickets/store";
import { removeStored, saveVideoStream, uploadDir, UploadError, VIDEO_MAX_BYTES } from "@/lib/uploads/files";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.
// Videos are too big for a Server Action, which buffers the whole body. The browser streams one here first, it goes
// straight to UPLOAD_DIR (rule 13), and the ticket or reply form then claims it by id. proxy.ts skips this path so it
// doesn't buffer the body either; the session is checked here.

const tickets = ticketStore(db);

const fail = (status: number, error: string) => Response.json({ error }, { status });

async function signedIn() {
  const user = await getCurrentUser();
  return user && !user.mustChangePassword && can(user, "tickets.comment") ? user : null;
}

/** POST /uploads/video — the raw file as the body, its name in X-File-Name. */
export async function POST(req: Request) {
  await connection();
  const user = await signedIn();
  if (!user) return fail(401, "Your session has ended. Sign in again, then add the video.");

  const declared = Number(req.headers.get("content-length") ?? "");
  if (declared > VIDEO_MAX_BYTES) return fail(413, `Videos can be at most ${VIDEO_MAX_BYTES / 1024 / 1024} MB.`);
  if (!req.body) return fail(400, "No video was sent.");

  let name = "video";
  try {
    name = decodeURIComponent(req.headers.get("x-file-name") ?? "video");
  } catch {}

  let dir: string;
  try {
    dir = uploadDir();
  } catch (e) {
    if (e instanceof UploadError) return fail(500, e.message);
    throw e;
  }

  let saved;
  try {
    saved = await saveVideoStream(dir, req.body, name);
  } catch (e) {
    if (e instanceof UploadError) return fail(422, e.message);
    if (req.signal.aborted) return fail(499, "Upload cancelled.");
    throw e;
  }

  let id: string;
  try {
    id = await tickets.pending.create(user, saved);
  } catch (e) {
    await removeStored(dir, [saved]);
    if (e instanceof TicketError) return fail(403, e.message);
    throw e;
  }

  // Best effort: clear out uploads nobody sent. Never fails this upload.
  tickets.pending
    .sweep()
    .then((stale) => removeStored(dir, stale))
    .catch((e) => console.error("[uploads] sweep failed:", e));

  return Response.json({ id, name: saved.originalName, size: saved.size, durationSec: saved.durationSec ?? null });
}

/** DELETE /uploads/video?id=… — drops one of your own uploads that hasn't been sent yet. */
export async function DELETE(req: Request) {
  await connection();
  const user = await signedIn();
  if (!user) return fail(401, "Sign in again.");
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const row = await tickets.pending.remove(user, id);
  if (row) await removeStored(uploadDir(), [row]);
  return new Response(null, { status: 204 });
}
