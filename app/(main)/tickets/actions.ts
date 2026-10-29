"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAction, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromZodError, text, type FormState } from "@/lib/form";
import { commentInput, ticketCreate, ticketEdit, transitionInput } from "@/lib/schemas/ticket";
import { TicketError, ticketStore } from "@/lib/tickets/store";
import { MAX_FILES_PER_POST, MAX_VIDEOS_PER_POST, removeStored, saveImage, uploadDir, UploadError, type SavedFile } from "@/lib/uploads/files";

const tickets = ticketStore(db);

/** Writes the posted images to UPLOAD_DIR. On any problem, removes what was already written and returns the message. */
async function saveUploads(fd: FormData): Promise<{ files: SavedFile[] } | { error: string }> {
  const picked = fd.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  if (picked.length === 0) return { files: [] };
  if (picked.length > MAX_FILES_PER_POST) return { error: `Attach at most ${MAX_FILES_PER_POST} images at a time.` };
  const files: SavedFile[] = [];
  let dir = "";
  try {
    dir = uploadDir();
    for (const f of picked) files.push(await saveImage(dir, new Uint8Array(await f.arrayBuffer()), f.name));
    return { files };
  } catch (e) {
    if (dir) await removeStored(dir, files);
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
}

/** Ids of videos already streamed to /uploads/video; the store claims them (only the sender's own). */
function videoIds(fd: FormData): string[] | { error: string } {
  const ids = fd.getAll("videoIds").filter((v): v is string => typeof v === "string" && v.length > 0);
  return ids.length > MAX_VIDEOS_PER_POST ? { error: `Attach at most ${MAX_VIDEOS_PER_POST} video at a time.` } : ids;
}

/** Runs a store call; on a refusal, deletes the uploads it would have referenced and returns the message. */
async function run(files: SavedFile[], fn: () => Promise<unknown>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (files.length) await removeStored(uploadDir(), files);
    if (e instanceof TicketError) return { ok: false, message: e.message };
    throw e;
  }
}

function fields(fd: FormData) {
  return {
    type: text(fd, "type"),
    title: text(fd, "title"),
    description: text(fd, "description"),
    areaId: text(fd, "areaId"),
    severity: text(fd, "severity"),
    priority: text(fd, "priority") || undefined,
    foundIn: text(fd, "foundIn"),
  };
}

const refresh = (number?: number) => {
  revalidatePath("/tickets");
  revalidatePath("/");
  if (number) revalidatePath(`/tickets/${number}`);
};

export async function createTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.create");
  const parsed = ticketCreate.safeParse({ ...fields(fd), assigneeId: text(fd, "assigneeId") });
  if (!parsed.success) return fromZodError(parsed.error);

  const videos = videoIds(fd);
  if ("error" in videos) return { ok: false, message: videos.error };
  const up = await saveUploads(fd);
  if ("error" in up) return { ok: false, message: up.error, fieldErrors: { images: [up.error] } };

  let number = 0;
  const r = await run(up.files, async () => {
    number = (await tickets.create(me, parsed.data, up.files, videos)).number;
  });
  if (!r.ok) return r;
  refresh();
  redirect(`/tickets/${number}`);
}

export async function editTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.create");
  const parsed = ticketEdit.safeParse(fields(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const r = await run([], () => tickets.update(me, text(fd, "id"), parsed.data));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

export async function assignTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.assign");
  const r = await run([], () => tickets.assign(me, text(fd, "id"), text(fd, "assigneeId") || null));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

export async function moveTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = transitionInput.safeParse({ to: text(fd, "to"), note: text(fd, "note"), duplicateOf: text(fd, "duplicateOf") });
  if (!parsed.success) return fromZodError(parsed.error);
  const r = await run([], () => tickets.transition(me, text(fd, "id"), parsed.data));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

/** Permanent. The person must type the ticket's title (checked here too, not just in the dialog). */
export async function deleteTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.delete");
  let deleted: { number: number; files: { storedName: string }[] };
  try {
    deleted = await tickets.delete(me, text(fd, "id"), text(fd, "confirm"));
  } catch (e) {
    if (e instanceof TicketError) return { ok: false, message: e.message };
    throw e;
  }
  // The row is gone, so a file left behind would only waste space; don't fail the delete over it.
  if (deleted.files.length) await removeStored(uploadDir(), deleted.files).catch((e) => console.error(`[tickets] couldn't remove files of #${deleted.number}:`, e));
  refresh(deleted.number);
  redirect("/tickets?deleted=" + deleted.number);
}

export async function addComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.comment");
  const parsed = commentInput.safeParse({ body: text(fd, "body") });
  if (!parsed.success) return fromZodError(parsed.error);

  const videos = videoIds(fd);
  if ("error" in videos) return { ok: false, message: videos.error };
  const up = await saveUploads(fd);
  if ("error" in up) return { ok: false, message: up.error };
  const r = await run(up.files, () => tickets.comment(me, text(fd, "id"), parsed.data.body, up.files, videos));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}
