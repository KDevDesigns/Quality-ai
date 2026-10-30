import { connection } from "next/server";
import { db } from "@/lib/db";
import { ticketStore } from "@/lib/tickets/store";
import { checkUploaded, UploadError } from "@/lib/uploads/files";
import { objectInfo, objectReader, removeObjects } from "@/lib/uploads/storage";
import { fail, uploader } from "../shared";

// Step 2 of an upload (see ../sign/route.ts): the browser has PUT the file to Storage and asks for it to be checked.
// Its real size, its type from the first bytes and a video's length are checked here; a file that fails is deleted.

const tickets = ticketStore(db);

/** POST /uploads/[id] — checks the arrived file → { id, name, size, durationSec } */
export async function POST(_req: Request, { params }: RouteContext<"/uploads/[id]">) {
  await connection();
  const user = await uploader();
  if (!user) return fail(401, "Your session has ended. Sign in again, then add the file.");

  const { id } = await params;
  const row = await tickets.pending.signed(user, id);
  if (!row) return fail(404, "That upload has expired. Add the file again.");

  const info = await objectInfo(row.storedName);
  if (!info) return fail(409, "The file didn't arrive. Check the connection and add it again.");

  try {
    const checked = await checkUploaded({
      kind: row.kind,
      storedName: row.storedName,
      originalName: row.originalName,
      size: info.size,
      contentType: info.contentType,
      read: await objectReader(row.storedName),
    });
    await tickets.pending.ready(row.id, checked);
    return Response.json({ id: row.id, name: row.originalName, size: checked.size, durationSec: checked.durationSec });
  } catch (e) {
    if (!(e instanceof UploadError)) throw e;
    await tickets.pending.remove(user, row.id);
    await removeObjects([row.storedName]).catch((err) => console.error("[uploads] couldn't delete a refused file:", err));
    return fail(422, e.message);
  }
}

/** DELETE /uploads/[id] — drops one of your own uploads that hasn't been sent yet. */
export async function DELETE(_req: Request, { params }: RouteContext<"/uploads/[id]">) {
  await connection();
  const user = await uploader();
  if (!user) return fail(401, "Sign in again.");
  const { id } = await params;
  const row = await tickets.pending.remove(user, id);
  if (row) await removeObjects([row.storedName]).catch((e) => console.error("[uploads] couldn't delete a removed file:", e));
  return new Response(null, { status: 204 });
}
