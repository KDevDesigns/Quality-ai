"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAction, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromZodError, text, type FormState } from "@/lib/form";
import { commentInput, ticketCreate, ticketEdit, transitionInput } from "@/lib/schemas/ticket";
import { notificationStore } from "@/lib/tickets/notifications";
import { TicketError, ticketStore } from "@/lib/tickets/store";
import { removeObjects } from "@/lib/uploads/storage";

const tickets = ticketStore(db);

/**
 * Ids of images and videos the browser already uploaded to Storage (see app/(main)/uploads). The store claims them,
 * only the sender's own and finished ones. A refused post leaves them waiting, so the person can fix it and resend.
 */
const uploadIds = (fd: FormData): string[] => fd.getAll("uploadIds").filter((v): v is string => typeof v === "string" && v.length > 0);

/** Runs a store call and turns a refusal into the form's message. */
async function run(fn: () => Promise<unknown>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
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

  let number = 0;
  const r = await run(async () => {
    number = (await tickets.create(me, parsed.data, uploadIds(fd))).number;
  });
  if (!r.ok) return r;
  refresh();
  redirect(`/tickets/${number}`);
}

export async function editTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.create");
  const parsed = ticketEdit.safeParse(fields(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const r = await run(() => tickets.update(me, text(fd, "id"), parsed.data));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

export async function assignTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.assign");
  const r = await run(() => tickets.assign(me, text(fd, "id"), text(fd, "assigneeId") || null));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

export async function moveTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = transitionInput.safeParse({ to: text(fd, "to"), note: text(fd, "note"), duplicateOf: text(fd, "duplicateOf") });
  if (!parsed.success) return fromZodError(parsed.error);
  const r = await run(() => tickets.transition(me, text(fd, "id"), parsed.data));
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
  if (deleted.files.length) await removeObjects(deleted.files.map((f) => f.storedName)).catch((e) => console.error(`[tickets] couldn't remove files of #${deleted.number}:`, e));
  refresh(deleted.number);
  redirect("/tickets?deleted=" + deleted.number);
}

export async function addComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAction("tickets.comment");
  const parsed = commentInput.safeParse({ body: text(fd, "body") });
  if (!parsed.success) return fromZodError(parsed.error);

  const r = await run(() => tickets.comment(me, text(fd, "id"), parsed.data.body, uploadIds(fd)));
  if (r.ok) refresh(Number(text(fd, "number")));
  return r;
}

const notifications = notificationStore(db);

/** Opening a ticket marks it read for the person (the ticket page calls this once it has shown the latest activity). */
export async function markTicketRead(ticketId: string): Promise<void> {
  const me = await requireUser();
  await notifications.markRead(me, ticketId);
}

/** "Mark all as read" in the bell. */
export async function markAllTicketsRead(): Promise<void> {
  const me = await requireUser();
  await notifications.markAllRead(me);
  revalidatePath("/tickets");
  revalidatePath("/");
}
