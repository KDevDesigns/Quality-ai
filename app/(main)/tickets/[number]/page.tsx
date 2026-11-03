import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  ArrowLeftIcon,
  CircleDotIcon,
  FilePlusIcon,
  HistoryIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PencilLineIcon,
  UserRoundIcon,
} from "lucide-react";
import { ScrollToLatest } from "@/components/scroll-to-latest";
import { TicketPageSkeleton } from "@/components/skeletons";
import { ImageGallery } from "./image-viewer";
import { FiledReminder } from "./filed-reminder";
import { MarkRead } from "./mark-read";
import { Attachments, galleryImages, Thread } from "./conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areaPath } from "@/lib/areas/tree";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime, timeAgo } from "@/lib/format";
import { ticketFlow } from "@/lib/tickets/flow";
import { buildActivityLog, type LogEntry } from "@/lib/tickets/log";
import { ticketStore } from "@/lib/tickets/store";
import {
  allowedTransitions,
  canAssign,
  canDeleteTicket,
  canEditTicket,
  DEVICE_LABELS,
  isDone,
  PRIORITY_LABELS,
  type DeviceType,
  SEVERITY_LABELS,
  type SeverityValue,
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
    <Suspense fallback={<TicketPageSkeleton />}>
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
      <MarkRead ticketId={t.id} number={t.number} lastActivityAt={t.lastActivityAt.toISOString()} />
      <FiledReminder userId={me.id} />
      <div className="grid gap-3">
        <Link href="/tickets" className="inline-flex w-fit items-center gap-1.5 text-[0.8438rem] text-muted-foreground hover:text-acc">
          <ArrowLeftIcon className="size-3.5" aria-hidden /> {me.role === "ADMIN" ? "All tickets" : "My tickets"}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[1.5rem] leading-tight font-semibold tracking-[-0.015em]">
              <span className="mr-2 font-mono text-muted-foreground">#{t.number}</span>
              {t.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
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
                  deviceType: t.deviceType as DeviceType | null,
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18.75rem]">
        <ImageGallery images={galleryImages(t)}>
          <div className="grid min-w-0 grid-cols-1 content-start gap-6">
            <Card>
              <CardContent className="grid gap-4">
                <p className="text-[0.9375rem] leading-relaxed wrap-anywhere whitespace-pre-wrap">{t.description}</p>
                <Attachments files={t.attachments} />
              </CardContent>
            </Card>

            <section aria-label="Conversation and history" className="grid grid-cols-1 gap-3">
              <h2 className="text-xs font-semibold tracking-[0.06em] text-ink2 uppercase">Conversation</h2>
              {/* Messenger-style: past a set height the messages scroll on their own, opened at the newest one, so the
                  reply box below never moves down. On a phone they scroll with the page: a box inside a scrolling page
                  traps the thumb. */}
              <div
                id="ticket-thread"
                tabIndex={0}
                aria-label="Messages and history"
                className="-mr-2 max-h-[min(55svh,36rem)] overflow-y-auto overscroll-contain pr-2 outline-none [scrollbar-gutter:stable] focus-visible:ring-3 focus-visible:ring-acc/20 max-md:mr-0 max-md:max-h-none max-md:overflow-visible max-md:pr-0"
              >
                <Thread t={t} meId={me.id} now={now} />
              </div>
              <ScrollToLatest targetId="ticket-thread" version={t.lastActivityAt.toISOString()} />
              <Card>
                <CardContent>
                  <CommentForm ticket={ref} />
                </CardContent>
              </Card>
            </section>
          </div>
        </ImageGallery>

        <aside className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3.5 text-[0.875rem]">
                <Detail label="Status"><TicketStatusPill status={t.status} /></Detail>
                <Detail label="Developer">
                  {assignable && options ? (
                    <AssignControl ticket={ref} areas={options.areas} people={options.people} areaId={t.areaId ?? ""} assigneeId={t.assigneeId ?? ""} assigneeName={t.assignee?.name ?? null} />
                  ) : (
                    <span className={cn(!t.assignee && "text-muted-foreground")}>{t.assignee?.name ?? "Not assigned"}</span>
                  )}
                </Detail>
                <Detail label="Module">{t.area ? areaPath(t.area) : <span className="text-muted-foreground">Not set</span>}</Detail>
                {t.severity ? <Detail label="Severity">{SEVERITY_LABELS[t.severity as SeverityValue]}</Detail> : null}
                <Detail label="Priority">{PRIORITY_LABELS[t.priority]}</Detail>
                {t.foundIn ? <Detail label="Found in">{t.foundIn}</Detail> : null}
                {t.deviceType ? <Detail label="Device type">{DEVICE_LABELS[t.deviceType as DeviceType]}</Detail> : null}
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
      <ol className="max-h-[26.25rem] overflow-y-auto overscroll-contain" aria-label="Activity log, newest first">
        {[...entries].reverse().map((e) => {
          const Icon = LOG_ICON[e.kind];
          return (
            <li key={`${e.kind}-${e.id}`} className="flex gap-2.5 border-t border-line2 px-5 py-2.5 first:border-t-0">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 text-[0.8125rem] leading-snug">
                <div>
                  <span className="font-semibold">{e.who}</span> <span className="text-ink2">{e.text}</span>
                </div>
                {e.note ? <div className="mt-0.5 line-clamp-2 text-muted-foreground" title={e.note}>“{e.note}”</div> : null}
                <time className="mt-0.5 block text-[0.75rem] text-muted-foreground tabular-nums" dateTime={e.at.toISOString()}>
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
      <dt className="text-[0.75rem] font-medium tracking-[0.04em] text-muted-foreground uppercase">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
