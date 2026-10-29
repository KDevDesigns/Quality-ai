import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { ticketStore } from "@/lib/tickets/store";
import { resolveStored, uploadDir } from "@/lib/uploads/files";
import { parseRange } from "@/lib/uploads/range";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.
// Ticket attachments are only ever served from here, after a session check (CLAUDE.md rule 13).
// Range requests are answered so videos can be scrubbed without downloading the whole file first.

/** GET /files/[id] — one ticket attachment, for someone who may see its ticket. */
export async function GET(req: Request, { params }: RouteContext<"/files/[id]">) {
  await connection();
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !can(user, "tickets.view")) return new Response("Sign in to view this file.", { status: 401 });

  const { id } = await params;
  // Only files on tickets this person may see; anything else looks like it doesn't exist.
  const file = await ticketStore(db).attachmentFor(user, id);
  const abs = file ? resolveStored(uploadDir(), file.storedName) : null;
  const size = abs ? await stat(abs).then((s) => s.size).catch(() => null) : null;
  if (!file || !abs || size === null) return new Response("File not found.", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": file.mime,
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; sandbox",
  };
  const range = parseRange(req.headers.get("range"), size);
  if (range === "unsatisfiable") return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });

  const { start, end } = range === "full" ? { start: 0, end: size - 1 } : range;
  const body = size === 0 ? null : (Readable.toWeb(createReadStream(abs, { start, end })) as ReadableStream<Uint8Array>);
  return new Response(body, {
    status: range === "full" ? 200 : 206,
    headers: {
      ...headers,
      "Content-Length": String(size === 0 ? 0 : end - start + 1),
      ...(range === "full" ? {} : { "Content-Range": `bytes ${start}-${end}/${size}` }),
    },
  });
}
