import { ArrowRightLeftIcon, CircleDotIcon, PencilLineIcon, UserRoundIcon } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { formatBytes, formatDateTime, formatDuration, initials, timeAgo } from "@/lib/format";
import type { TicketDetail } from "@/lib/tickets/store";
import { STATUS_LABELS, type TicketStatus } from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { ImageThumb, type GalleryImage } from "./image-viewer";

// A ticket's conversation: its messages and timeline lines, and the files on the description and replies. Shared by
// the ticket page and My inbox, so a conversation looks the same in both.

type FileRow = TicketDetail["attachments"][number];

export function Attachments({ files }: { files: FileRow[] }) {
  if (!files.length) return null;
  const videos = files.filter((f) => f.kind === "VIDEO");
  const images = files.filter((f) => f.kind !== "VIDEO");
  return (
    <div className="grid gap-3">
      {videos.map((f) => (
        <figure key={f.id} className="grid max-w-2xl gap-1">
          {/* Streams from the auth-checked /files route; seeking uses Range requests. */}
          <video src={`/files/${f.id}`} controls preload="metadata" playsInline className="max-h-[420px] w-full rounded-lg border border-line bg-black" />
          <figcaption className="truncate text-[11.5px] text-muted-foreground" title={f.originalName}>
            <a href={`/files/${f.id}`} target="_blank" rel="noopener" className="hover:text-acc">
              {f.originalName}
            </a>
            {f.durationSec !== null ? ` · ${formatDuration(f.durationSec)}` : ""} · {formatBytes(f.size)}
          </figcaption>
        </figure>
      ))}
      {images.length ? <ImageList files={images} /> : null}
    </div>
  );
}

/** Every image on the ticket in the order it is read: the description, then each reply, oldest first. Only what the viewer shows goes to the browser. */
export function galleryImages(t: TicketDetail): GalleryImage[] {
  return [...t.attachments, ...t.comments.flatMap((c) => c.attachments)]
    .filter((f) => f.kind !== "VIDEO")
    .map((f) => ({ id: f.id, originalName: f.originalName, size: f.size }));
}

/** Thumbnails; each opens the ticket's image gallery (see image-viewer.tsx). */
function ImageList({ files }: { files: FileRow[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {files.map((f) => (
        <li key={f.id}>
          <ImageThumb file={{ id: f.id, originalName: f.originalName, size: f.size }} />
        </li>
      ))}
    </ul>
  );
}

type Item =
  | { kind: "comment"; at: Date; c: TicketDetail["comments"][number] }
  | { kind: "event"; at: Date; e: TicketDetail["events"][number] };

/** Comments and timeline events in one list, oldest first. */
export function Thread({ t, meId, now }: { t: TicketDetail; meId: string; now: Date }) {
  const items: Item[] = [
    ...t.comments.map((c): Item => ({ kind: "comment", at: c.createdAt, c })),
    ...t.events.filter((e) => e.kind !== "CREATED").map((e): Item => ({ kind: "event", at: e.createdAt, e })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (!items.length) return <p className="text-sm text-muted-foreground">No replies yet. Ask a question or add details below.</p>;

  return (
    <ol className="grid gap-3">
      {items.map((it) =>
        it.kind === "comment" ? (
          <li key={it.c.id}>
            <Message author={it.c.author} mine={it.c.author.id === meId} at={it.c.createdAt} now={now} body={it.c.body} files={it.c.attachments} />
          </li>
        ) : (
          <li key={it.e.id} className="flex gap-3 pl-1.5 text-[13.5px] text-ink2">
            <EventIcon kind={it.e.kind} />
            <div className="min-w-0 flex-1 py-1">
              <span className="font-medium text-foreground">{it.e.actor.name}</span> <EventText e={it.e} />{" "}
              <time className="text-muted-foreground" title={formatDateTime(it.e.createdAt)}>· {timeAgo(it.e.createdAt, now)}</time>
              {it.e.note ? <p className="mt-1.5 rounded-lg border-l-[3px] border-acc-b bg-surface2 px-3 py-2 break-words whitespace-pre-wrap text-foreground">{it.e.note}</p> : null}
            </div>
          </li>
        ),
      )}
    </ol>
  );
}

/** One message: a reply, or (in My inbox) the ticket's description as the opening message. */
export function Message({
  author,
  mine,
  at,
  now,
  body,
  files,
}: {
  author: { name: string; role: string };
  mine: boolean;
  at: Date;
  now: Date;
  body: string;
  files: FileRow[];
}) {
  return (
    <div className="flex gap-3">
      <Avatar name={author.name} mine={mine} />
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
          <span className="font-semibold text-foreground">{author.name}</span>
          <span className="text-muted-foreground">{ROLE_LABELS[author.role as Role]}</span>
          <time className="text-muted-foreground" title={formatDateTime(at)}>· {timeAgo(at, now)}</time>
        </div>
        {body ? <p className="mt-1.5 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">{body}</p> : null}
        {files.length ? (
          <div className="mt-3">
            <Attachments files={files} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ name, mine }: { name: string; mine: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold", mine ? "bg-acc text-primary-foreground" : "bg-acc-t text-acc-ink")}
    >
      {initials(name)}
    </span>
  );
}

function EventIcon({ kind }: { kind: string }) {
  const Icon = kind === "STATUS" ? CircleDotIcon : kind === "ASSIGNEE" ? UserRoundIcon : kind === "FIELD" ? PencilLineIcon : ArrowRightLeftIcon;
  return (
    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface3 text-ink2" aria-hidden>
      <Icon className="size-3.5" />
    </span>
  );
}

function EventText({ e }: { e: TicketDetail["events"][number] }) {
  const b = (s: string) => <span className="font-medium text-foreground">{s}</span>;
  if (e.kind === "STATUS") {
    const from = STATUS_LABELS[e.from as TicketStatus] ?? e.from;
    const to = STATUS_LABELS[e.to as TicketStatus] ?? e.to;
    return <>moved it from {b(from ?? "?")} to {b(to ?? "?")}</>;
  }
  if (e.kind === "ASSIGNEE") {
    if (!e.to) return <>unassigned {b(e.from ?? "the developer")}</>;
    return e.from ? <>reassigned it from {b(e.from)} to {b(e.to)}</> : <>assigned it to {b(e.to)}</>;
  }
  if (e.kind === "FIELD") {
    if (e.field === "description") return <>edited the description</>;
    return <>changed the {e.field} from {b(e.from ?? "none")} to {b(e.to ?? "none")}</>;
  }
  return <>updated the ticket</>;
}
