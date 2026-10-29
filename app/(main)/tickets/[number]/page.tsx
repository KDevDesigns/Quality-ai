import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  CircleDotIcon,
  FilePlusIcon,
  HistoryIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PencilLineIcon,
  UserRoundIcon,
} from "lucide-react";
import { LoadingBlock } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areaPath } from "@/lib/areas/tree";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatBytes, formatDateTime, formatDuration, initials, timeAgo } from "@/lib/format";
import { ticketFlow } from "@/lib/tickets/flow";
import { buildActivityLog, type LogEntry } from "@/lib/tickets/log";
import { ticketStore, type TicketDetail } from "@/lib/tickets/store";
import {
  allowedTransitions,
  canAssign,
  canDeleteTicket,
  canEditTicket,
  isDone,
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type SeverityValue,
  type TicketStatus,
} from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { ticketFormOptions } from "../options";
import { SeverityTag, TicketStatusPill, TicketTypeLabel } from "../ticket-bits";
import { AssignControl, CommentForm, DeleteTicketDialog, EditTicketDialog, StatusMoves } from "./ticket-controls";
import { TicketFlow } from "./ticket-flow";

export const metadata: Metadata = { title: "Ticket" };

const tickets = ticketStore(db);

export default function TicketPage({ params }: PageProps<"/tickets/[number]">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TicketView params={params} />
    </Suspense>
  );
}

async function TicketView({ params }: { params: Promise<{ number: string }> }) {
  const { number: raw } = await params;
  await connection();
  const me = await requireAction("tickets.view");
  const number = /^\d{1,9}$/.test(raw) ? Number(raw) : NaN;
  // Someone else's ticket is a 404, the same as a missing one.
  const t = Number.isFinite(number) ? await tickets.get(number, me) : null;
  if (!t) notFound();

  const ref = { id: t.id, number: t.number };
  const moves = allowedTransitions(t, me);
  const editable = canEditTicket(t, me);
  const deletable = canDeleteTicket(t, me);
  const log = buildActivityLog(t);
  const assignable = canAssign(me) && !isDone(t.status);
  const options = editable || assignable ? await ticketFormOptions() : null;
  const now = new Date();

  return (
    <>
      <div className="grid gap-3">
        <Link href="/tickets" className="inline-flex w-fit items-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-acc">
          <ArrowLeftIcon className="size-3.5" aria-hidden /> {me.role === "ADMIN" ? "All tickets" : "My tickets"}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.015em]">
              <span className="mr-2 font-mono text-muted-foreground">#{t.number}</span>
              {t.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
              <TicketStatusPill status={t.status} />
              <TicketTypeLabel type={t.type} />
              <SeverityTag severity={t.severity as SeverityValue | null} />
              <span>
                Filed by {t.reporter.name} · <time title={formatDateTime(t.createdAt)}>{timeAgo(t.createdAt, now)}</time>
              </span>
              {t.duplicateOf ? (
                <Link href={`/tickets/${t.duplicateOf.number}`} className="font-medium text-acc hover:underline">
                  Duplicate of #{t.duplicateOf.number}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editable && options ? (
              <EditTicketDialog
                areas={options.areas}
                people={options.people}
                ticket={{
                  id: t.id,
                  number: t.number,
                  type: t.type,
                  title: t.title,
                  description: t.description,
                  areaId: t.areaId,
                  severity: t.severity as SeverityValue | null,
                  priority: t.priority,
                  foundIn: t.foundIn,
                }}
              />
            ) : null}
            {deletable ? (
              <DeleteTicketDialog
                ticket={{ id: t.id, number: t.number, title: t.title }}
                replies={t.comments.length}
                files={t.attachments.length + t.comments.reduce((n, c) => n + c.attachments.length, 0)}
              />
            ) : null}
          </div>
        </div>
        <StatusMoves ticket={ref} status={t.status} moves={moves} />
      </div>

      <TicketFlow flow={ticketFlow(t)} now={now} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardContent className="grid gap-4">
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{t.description}</p>
              <Attachments files={t.attachments} />
            </CardContent>
          </Card>

          <section aria-label="Conversation and history" className="grid gap-3">
            <h2 className="text-xs font-semibold tracking-[0.06em] text-ink2 uppercase">Conversation</h2>
            <Thread t={t} meId={me.id} now={now} />
            <Card>
              <CardContent>
                <CommentForm ticket={ref} />
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3.5 text-[14px]">
                <Detail label="Status"><TicketStatusPill status={t.status} /></Detail>
                <Detail label="Developer">
                  {assignable && options ? (
                    <AssignControl ticket={ref} areas={options.areas} people={options.people} areaId={t.areaId ?? ""} assigneeId={t.assigneeId ?? ""} />
                  ) : (
                    <span className={cn(!t.assignee && "text-muted-foreground")}>{t.assignee?.name ?? "Not assigned"}</span>
                  )}
                </Detail>
                <Detail label="Module">{t.area ? areaPath(t.area) : <span className="text-muted-foreground">Not set</span>}</Detail>
                {t.severity ? <Detail label="Severity">{SEVERITY_LABELS[t.severity as SeverityValue]}</Detail> : null}
                <Detail label="Priority">{PRIORITY_LABELS[t.priority]}</Detail>
                {t.foundIn ? <Detail label="Found in">{t.foundIn}</Detail> : null}
                <Detail label="Reported by">{t.reporter.name}</Detail>
                <Detail label="Filed">{formatDateTime(t.createdAt)}</Detail>
                {t.closedAt ? <Detail label="Closed">{formatDateTime(t.closedAt)}</Detail> : null}
              </dl>
            </CardContent>
          </Card>
          <ActivityLog entries={log} />
        </aside>
      </div>
    </>
  );
}

const LOG_ICON: Record<LogEntry["kind"], typeof CircleDotIcon> = {
  created: FilePlusIcon,
  status: CircleDotIcon,
  assignee: UserRoundIcon,
  field: PencilLineIcon,
  reply: MessageSquareIcon,
  attachment: PaperclipIcon,
};

/** Every movement on the ticket with its exact time, newest first. */
function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-acc" aria-hidden /> Activity log
        </CardTitle>
      </CardHeader>
      <ol className="max-h-[420px] overflow-y-auto" aria-label="Activity log, newest first">
        {[...entries].reverse().map((e) => {
          const Icon = LOG_ICON[e.kind];
          return (
            <li key={`${e.kind}-${e.id}`} className="flex gap-2.5 border-t border-line2 px-5 py-2.5 first:border-t-0">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 text-[13px] leading-snug">
                <div>
                  <span className="font-semibold">{e.who}</span> <span className="text-ink2">{e.text}</span>
                </div>
                {e.note ? <div className="mt-0.5 line-clamp-2 text-muted-foreground" title={e.note}>“{e.note}”</div> : null}
                <time className="mt-0.5 block text-[12px] text-muted-foreground tabular-nums" dateTime={e.at.toISOString()}>
                  {formatDateTime(e.at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[12px] font-medium tracking-[0.04em] text-muted-foreground uppercase">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

type FileRow = TicketDetail["attachments"][number];

function Attachments({ files }: { files: FileRow[] }) {
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

function ImageList({ files }: { files: FileRow[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {files.map((f) => (
        <li key={f.id}>
          <a href={`/files/${f.id}`} target="_blank" rel="noopener" className="group block w-44 overflow-hidden rounded-lg border border-line bg-surface2 hover:border-acc-b">
            {/* eslint-disable-next-line @next/next/no-img-element -- served by the auth-checked /files route, not next/image */}
            <img src={`/files/${f.id}`} alt={f.originalName} loading="lazy" className="h-28 w-full object-cover" />
            <span className="block truncate px-2 py-1 text-[11.5px] text-muted-foreground group-hover:text-acc" title={f.originalName}>
              {f.originalName} · {formatBytes(f.size)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

type Item =
  | { kind: "comment"; at: Date; c: TicketDetail["comments"][number] }
  | { kind: "event"; at: Date; e: TicketDetail["events"][number] };

/** Comments and timeline events in one list, oldest first. */
function Thread({ t, meId, now }: { t: TicketDetail; meId: string; now: Date }) {
  const items: Item[] = [
    ...t.comments.map((c): Item => ({ kind: "comment", at: c.createdAt, c })),
    ...t.events.filter((e) => e.kind !== "CREATED").map((e): Item => ({ kind: "event", at: e.createdAt, e })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (!items.length) return <p className="text-sm text-muted-foreground">No replies yet. Ask a question or add details below.</p>;

  return (
    <ol className="grid gap-3">
      {items.map((it) =>
        it.kind === "comment" ? (
          <li key={it.c.id} className="flex gap-3">
            <Avatar name={it.c.author.name} mine={it.c.author.id === meId} />
            <div className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                <span className="font-semibold text-foreground">{it.c.author.name}</span>
                <span className="text-muted-foreground">{ROLE_LABELS[it.c.author.role as Role]}</span>
                <time className="text-muted-foreground" title={formatDateTime(it.c.createdAt)}>· {timeAgo(it.c.createdAt, now)}</time>
              </div>
              {it.c.body ? <p className="mt-1.5 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">{it.c.body}</p> : null}
              {it.c.attachments.length ? (
                <div className="mt-3">
                  <Attachments files={it.c.attachments} />
                </div>
              ) : null}
            </div>
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
