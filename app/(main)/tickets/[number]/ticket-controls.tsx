"use client";

import { useActionState, useState } from "react";
import { ArrowRightLeftIcon, PencilIcon, SendIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { Field, FormMessage } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTouchScreen } from "@/hooks/use-touch-screen";
import { initialFormState, type FormState } from "@/lib/form";
import { STATUS_LABELS, type TicketStatus, type Transition } from "@/lib/tickets/workflow";
import { addComment, assignTicket, deleteTicket, moveTicket } from "../actions";
import { AttachMenu } from "../attach-menu";
import { ImagePicker, useImageAttachments } from "../image-picker";
import { useVideoUpload, VideoPicker } from "../video-picker";
import { AssigneeSelect, submitKeepingInput, TicketForm, type AreaOption, type AssigneeOption, type TicketValues } from "../ticket-form";

type Ref = { id: string; number: number };

/** Moves that carry the ticket forward. The first of these is shown as the main button; side exits stay outlined. */
const FORWARD: readonly TicketStatus[] = ["IN_PROGRESS", "FIXED", "VERIFIED"];
const isMain = (m: Transition) => FORWARD.includes(m.to) || (m.to === "CLOSED" && m.label === "Close");

/** The status buttons. Each opens a short dialog for the note. */
export function StatusMoves({ ticket, status, moves }: { ticket: Ref; status: TicketStatus; moves: Transition[] }) {
  if (!moves.length) return null;
  const main = moves.find(isMain);
  return (
    <div className="flex flex-wrap gap-2">
      {moves.map((m) => (
        <FormDialog
          key={m.to}
          title={m.label}
          description={`${STATUS_LABELS[status]} → ${STATUS_LABELS[m.to]}`}
          trigger={
            <Button variant={m === main ? "default" : "outline"} size="sm">
              {m.label}
            </Button>
          }
        >
          {(close) => <MoveForm ticket={ticket} move={m} onDone={close} />}
        </FormDialog>
      ))}
    </div>
  );
}

const NOTE_HINTS: Partial<Record<TicketStatus, string>> = {
  NEED_INFO: "What do you need from QA? They'll see this in the thread.",
  FIXED: "Optional: what changed and in which build, so QA knows what to retest.",
  REOPENED: "What is still wrong? Add a screenshot in a comment if it helps.",
  REJECTED: "Why this isn't a bug, e.g. it works as the business rule says.",
  WONT_FIX: "Why it won't be fixed.",
  CLOSED: "Optional.",
};

function MoveForm({ ticket, move, onDone }: { ticket: Ref; move: Transition; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await moveTicket(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);
  const err = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitKeepingInput(action)} className="grid gap-4">
      <input type="hidden" name="id" value={ticket.id} />
      <input type="hidden" name="number" value={ticket.number} />
      <input type="hidden" name="to" value={move.to} />
      {move.needsDuplicate ? (
        <Field label="Duplicate of ticket #" htmlFor="duplicateOf" error={err.duplicateOf} required>
          <Input id="duplicateOf" name="duplicateOf" inputMode="numeric" required placeholder="e.g. 12" className="w-32 font-mono" />
        </Field>
      ) : null}
      <Field label="Note" htmlFor="note" error={err.note} required={move.needsNote} hint={NOTE_HINTS[move.to] ?? "Optional."}>
        <Textarea id="note" name="note" rows={3} maxLength={5000} required={move.needsNote} autoFocus />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : move.label}</Button>
      </div>
    </form>
  );
}

/**
 * The Developer box in a ticket's details. With a developer set it shows their name and **Reassign**, which opens the
 * picker and an optional reason for the timeline; with none, the picker shows straight away with **Assign**.
 */
export function AssignControl({
  ticket,
  areas,
  people,
  areaId,
  assigneeId,
  assigneeName,
}: {
  ticket: Ref;
  areas: AreaOption[];
  people: AssigneeOption[];
  areaId: string;
  assigneeId: string;
  assigneeName: string | null;
}) {
  const [open, setOpen] = useState(!assigneeId);
  const [chosen, setChosen] = useState(assigneeId);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await assignTicket(prev, fd);
    if (r.ok) setOpen(false);
    return r;
  }, initialFormState);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{assigneeName ?? "Not assigned"}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ArrowRightLeftIcon /> Reassign
        </Button>
      </div>
    );
  }

  const changed = chosen !== assigneeId;
  return (
    <form onSubmit={submitKeepingInput(action)} className="panel-in grid gap-2.5">
      <input type="hidden" name="id" value={ticket.id} />
      <input type="hidden" name="number" value={ticket.number} />
      <AssigneeSelect areas={areas} people={people} areaId={areaId} defaultValue={assigneeId} id="assign" onValueChange={setChosen} />
      {assigneeId ? (
        <Textarea name="note" rows={2} maxLength={500} placeholder="Reason (optional), e.g. Ben is on leave" aria-label="Reason for reassigning" className="min-h-0 text-[0.875rem]" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !changed}>
          {pending ? "Saving…" : assigneeId ? "Save" : "Assign"}
        </Button>
        {assigneeId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setChosen(assigneeId);
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function CommentForm({ ticket }: { ticket: Ref }) {
  const images = useImageAttachments();
  const video = useVideoUpload();
  const touch = useTouchScreen();
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await addComment(prev, fd);
    if (r.ok) {
      setBody("");
      images.clear();
      video.clear();
    }
    return r;
  }, initialFormState);
  const busy = pending || video.busy || images.busy;
  const canSend = !busy && !images.failed && !video.blocked && (!!body.trim() || images.items.length > 0 || video.upload.status === "done");

  return (
    <form
      onSubmit={submitKeepingInput(action)}
      className="grid gap-3"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        const files = [...e.dataTransfer.files];
        if (!files.length) return;
        e.preventDefault();
        // The markup dialog is this form's child in React, so what's dropped on it arrives here too.
        if (!e.currentTarget.contains(e.target as Node)) return;
        const clip = files.find((f) => f.type.startsWith("video/"));
        if (clip) void video.start(clip);
        const rest = files.filter((f) => f !== clip);
        if (rest.length) images.add(rest);
      }}
    >
      <input type="hidden" name="id" value={ticket.id} />
      <input type="hidden" name="number" value={ticket.number} />
      <label htmlFor="body" className="sr-only">Your message</label>
      <Textarea
        id="body"
        name="body"
        rows={3}
        maxLength={20000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onPaste={images.onPaste}
        onKeyDown={(e) => {
          // Enter sends, like a chat; Shift+Enter starts a new line. Not while an IME is composing a word, and not
          // while files are still uploading (the message would go without them). A phone keyboard has no Shift+Enter, so
          // there Enter starts a new line and the Send button sends.
          if (touch || e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
          e.preventDefault();
          if (canSend) e.currentTarget.form?.requestSubmit();
        }}
        placeholder={touch ? "Write a reply…" : "Write a reply… (Enter to send, Shift+Enter for a new line, Ctrl+V to paste a screenshot)"}
      />
      <ImagePicker state={images} id="comment-images" compact />
      <VideoPicker state={video} id="comment-video" compact />
      <FormMessage state={state} />
      <div className="flex items-center justify-between gap-2">
        <AttachMenu images={images} video={video} imagesId="comment-images" videoId="comment-video" />
        <Button type="submit" disabled={!canSend}>
          <SendIcon /> {video.busy ? "Uploading video…" : images.busy ? "Uploading…" : images.failed || video.blocked ? "Finish the files above" : pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Permanent delete, the way GitHub deletes a repository: a red danger box spelling out what goes, and the button
 * stays disabled until the exact ticket title is typed.
 */
export function DeleteTicketDialog({ ticket, replies, files }: { ticket: { id: string; number: number; title: string }; replies: number; files: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState(deleteTicket, initialFormState);
  const matches = typed.trim() === ticket.title;
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="border-bad-b text-bad hover:border-bad hover:bg-bad-t hover:text-bad">
            <Trash2Icon /> Delete
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-bad">
            <TriangleAlertIcon className="size-5" aria-hidden /> Delete ticket #{ticket.number}?
          </DialogTitle>
          <DialogDescription>This can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submitKeepingInput(action)} className="grid gap-4">
          <input type="hidden" name="id" value={ticket.id} />
          <div className="rounded-[0.625rem] border border-bad-b bg-bad-t px-4 py-3 text-[0.8438rem] leading-relaxed text-bad">
            <p className="font-semibold">This permanently deletes, for everyone:</p>
            <ul className="mt-1 list-disc pl-5">
              <li>the ticket and its description</li>
              <li>the conversation ({plural(replies, "reply", "replies")})</li>
              <li>the activity log</li>
              <li>{plural(files, "attached file")} (screenshots and videos) from the server</li>
            </ul>
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirm-title" className="text-sm">
              To confirm, type the ticket&apos;s title exactly:
              <span className="mt-1.5 block rounded-md bg-surface3 px-2.5 py-1.5 font-mono text-[0.8125rem] font-semibold break-words select-all">{ticket.title}</span>
            </label>
            <Input id="confirm-title" name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} autoFocus aria-invalid={!!state.message} />
          </div>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={!matches || pending}>
              <Trash2Icon /> {pending ? "Deleting…" : "Delete this ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditTicketDialog({ ticket, areas, people }: { ticket: TicketValues; areas: AreaOption[]; people: AssigneeOption[] }) {
  return (
    <FormDialog
      wide
      title={`Edit #${ticket.number}`}
      trigger={
        <Button variant="outline" size="sm">
          <PencilIcon /> Edit
        </Button>
      }
    >
      {(close) => <TicketForm areas={areas} people={people} canAssign={false} ticket={ticket} onDone={close} />}
    </FormDialog>
  );
}
