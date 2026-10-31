import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { TicketError, ticketStore } from "@/lib/tickets/store";
import { planUpload, UploadError } from "@/lib/uploads/files";
import { signUpload } from "@/lib/uploads/storage";
import { fail, uploader } from "../shared";

// Files are too big for a Server Action or a Vercel function (4.5 MB body cap), so the browser uploads each one
// straight to Storage. Step 1: it asks here for a signed URL; the session and declared type and size are checked
// first, and the object name is generated here, never taken from the file name (CLAUDE.md rule 4).

const tickets = ticketStore(db);

const body = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]),
  name: z.string().max(500),
  type: z.string().max(100),
  size: z.number().int(),
});

/** POST /uploads/sign — { kind, name, type, size } → { id, url, headers } */
export async function POST(req: Request) {
  await connection();
  const user = await uploader();
  if (!user) return fail(401, "Your session has ended. Sign in again, then add the file.");

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "That upload request wasn't understood.");

  try {
    const plan = planUpload(parsed.data);
    const id = await tickets.pending.create(user, { kind: parsed.data.kind, ...plan, size: parsed.data.size });
    const signed = await signUpload(plan.storedName, plan.mime);
    return Response.json({ id, ...signed });
  } catch (e) {
    if (e instanceof UploadError) return fail(422, e.message);
    if (e instanceof TicketError) return fail(403, e.message);
    throw e;
  }
}
