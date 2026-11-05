import { ArrowRightLeftIcon, CircleDotIcon, PencilLineIcon, UserRoundIcon } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { UserAvatar } from "@/components/user-avatar";
import type { AvatarPerson } from "@/lib/avatar";
import { formatBytes, formatDateTime, formatDuration, timeAgo } from "@/lib/format";
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
          {/* Streams from the auth-checked /files route; seeking uses Range requests. Nothing loads until Play: even
              "metadata" made browsers fetch most of a phone recording on every visit, the biggest Storage download cost. */}
          <video src={`/files/${f.id}`} controls preload="none" playsInline className="max-h-[26.25rem] w-full rounded-lg border border-line bg-black" />
          <figcaption className="truncate text-[0.7188rem] text-muted-foreground" title={f.originalName}>
            <a href={`/files/${f.id}`} target="_blank" rel="noopener" className="hover:text-primary-text">
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
    <ol className="grid grid-cols-1 gap-3">
      {items.map((it) =>
        it.kind === "comment" ? (
          <li key={it.c.id}>
            <Message author={it.c.author} mine={it.c.author.id === meId} at={it.c.createdAt} now={now} body={it.c.body} files={it.c.attachments} />
          </li>
        ) : (
          <li key={it.e.id} className="flex gap-3 pl-1.5 text-[0.8438rem] text-ink2">
            <EventIcon kind={it.e.kind} />
            <div className="min-w-0 flex-1 py-1">
              <span className="font-medium text-foreground">{it.e.actor.name}</span> <EventText e={it.e} />{" "}
              <time className="text-muted-foreground" title={formatDateTime(it.e.createdAt)}>· {timeAgo(it.e.createdAt, now)}</time>
              {it.e.note ? <p className="mt-1.5 rounded-lg border-l-[0.1875rem] border-acc-b bg-surface2 px-3 py-2 wrap-anywhere whitespace-pre-wrap text-foreground">{it.e.note}</p> : null}
            </div>
          </li>
        ),
      )}
    </ol>
  );
}

/**
 * One message: a reply, or (in My inbox) the ticket's description as the opening message. Chat-style, so it's clear who
 * said what: your own messages sit on the right in a tinted bubble, everyone else's on the left.
 */
export function Message({
  author,
  mine,
  at,
  now,
  body,
  files,
}: {
  author: AvatarPerson & { role: string };
  mine: boolean;
  at: Date;
  now: Date;
  body: string;
  files: FileRow[];
}) {
  return (
    <div className={cn("flex items-start gap-3", mine && "flex-row-reverse")}>
      <UserAvatar person={author} className="size-9 text-[0.8125rem]" />
      <div
        className={cn(
          "max-w-[85%] min-w-0 rounded-2xl border px-4 py-3",
          files.length ? "w-full" : "w-fit",
          mine ? "rounded-tr-md border-acc-b bg-acc-t" : "rounded-tl-md border-line bg-card",
        )}
      >
        <div className={cn("flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]", mine && "justify-end")}>
          <span className="font-semibold text-foreground">{mine ? "You" : author.name}</span>
          <span className="text-muted-foreground">{ROLE_LABELS[author.role as Role]}</span>
          <time className="text-muted-foreground" title={formatDateTime(at)}>· {timeAgo(at, now)}</time>
        </div>
        {body ? <p className="mt-1.5 text-[0.9063rem] leading-relaxed wrap-anywhere whitespace-pre-wrap">{body}</p> : null}
        {files.length ? (
          <div className="mt-3">
            <Attachments files={files} />
          </div>
        ) : null}
      </div>
    </div>
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
