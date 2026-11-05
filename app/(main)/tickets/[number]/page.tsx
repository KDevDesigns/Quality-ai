import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { InfoTip } from "@/components/info-tip";
import { ScrollToLatest } from "@/components/scroll-to-latest";
import { TicketPageSkeleton } from "@/components/skeletons";
import { ImageGallery } from "./image-viewer";
import { DraftCleanup } from "./draft-cleanup";
import { MarkRead } from "./mark-read";
import { Evidence, galleryImages, Thread } from "./conversation";
import { Card } from "@/components/ui/card";
import { areaPath } from "@/lib/areas/tree";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { nextStep, ticketFlow } from "@/lib/tickets/flow";
import { buildActivityLog, type LogEntry } from "@/lib/tickets/log";
import { ticketStore } from "@/lib/tickets/store";
import {
  allowedTransitions,
  canAssign,
  canCategorize,
  CATEGORY_LABELS,
  NO_CATEGORY,
  canDeleteTicket,
  canEditTicket,
  DEVICE_LABELS,
  isDone,
  type DeviceType,
  type SeverityValue,
} from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { ticketFormOptions } from "../options";
import { LevelLabel, TicketStatusPill, TicketTypeLabel } from "../ticket-bits";
import { AssignControl, CategoryControl, CommentForm, DeleteTicketDialog, EditTicketDialog, StatusMoves } from "./ticket-controls";
import { NextStep, TicketFlow } from "./ticket-flow";
import { TicketPane, TicketTabs } from "./ticket-tabs";

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

  const header = (
    <>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-[1_1_32.5rem]">
            <h1 className="text-[1.5rem] leading-[1.2] font-semibold tracking-[-0.015em] wrap-anywhere md:text-[1.75rem]">
              <span className="mr-2 font-mono font-medium text-muted-foreground">#{t.number}</span>
              {t.title}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <TicketStatusPill status={t.status} />
              <TicketTypeLabel type={t.type} className="md:border-transparent md:bg-transparent md:px-0 md:text-sm" />
              <LevelLabel value={(t.severity as SeverityValue | null) ?? t.priority} />
              <span>
                Filed by {t.reporter.name}, <time dateTime={t.createdAt.toISOString()} title={formatDateTime(t.createdAt)}>{formatDate(t.createdAt)}</time>
              </span>
              {t.duplicateOf ? (
                <Link href={`/tickets/${t.duplicateOf.number}`} className="font-medium text-primary-text hover:underline">
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

      <TicketFlow flow={ticketFlow(t)} now={now} />

      <NextStep {...nextStep(t, { isReporter: t.reporterId === me.id, isAssignee: t.assigneeId === me.id })}>
        <StatusMoves ticket={ref} status={t.status} moves={moves} />
      </NextStep>
    </>
  );

  // The other side of the conversation, for the reply box's placeholder.
  const replyTo = t.reporterId === me.id ? t.assignee?.name : t.reporter.name;

  return (
    <>
      <MarkRead ticketId={t.id} number={t.number} lastActivityAt={t.lastActivityAt.toISOString()} />
      <DraftCleanup userId={me.id} />
      <TicketTabs replies={t.comments.length} header={header}>
      {/* Main and side columns; the side column drops under when they no longer fit. On Conversation it's hidden, so the main one takes the width. */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_35rem]">
          <ImageGallery images={galleryImages(t)}>
            <div className="grid min-w-0 grid-cols-1 content-start gap-6">
              <TicketPane tab="details">
                <section aria-labelledby="report-title">
                  <Card className="p-5">
                    <h2 id="report-title" className="text-lg font-semibold">Report</h2>
                    {t.description ? <p className="mt-2.5 max-w-[72ch] text-[0.9375rem] leading-[1.6] wrap-anywhere whitespace-pre-wrap text-ink2">{t.description}</p> : null}
                    <Evidence files={t.attachments} />
                  </Card>
                </section>
              </TicketPane>

              <TicketPane tab="conversation">
                <section aria-labelledby="talk-title">
                  {/* Not clipped, so the Attach menu and the reply's markup dialog aren't cut off. */}
                  <Card className="overflow-visible">
                    <h2 id="talk-title" className="px-5 pt-5 pb-1 text-lg font-semibold">Conversation</h2>
                    {/* Messenger-style: past a set height the messages scroll on their own, opened at the newest one, so the
                        reply box below never moves down. On a phone they scroll with the page: a box inside a scrolling page
                        traps the thumb. */}
                    <div
                      id="ticket-thread"
                      tabIndex={0}
                      aria-label="Messages and history"
                      className="max-h-[min(55svh,36rem)] overflow-y-auto overscroll-contain px-5 pt-4 pb-5 outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset max-md:max-h-none max-md:overflow-visible"
                    >
                      <Thread t={t} meId={me.id} now={now} />
                    </div>
                    <ScrollToLatest targetId="ticket-thread" version={t.lastActivityAt.toISOString()} />
                    <div id="ticket-reply" className="scroll-mb-5 border-t border-line2 px-5 pt-4 pb-5">
                      <CommentForm ticket={ref} replyTo={replyTo ?? ""} />
                    </div>
                  </Card>
                </section>
              </TicketPane>
            </div>
          </ImageGallery>
        </div>

        <TicketPane tab="details">
          <aside className="flex min-w-0 flex-[1_1_20rem] flex-col gap-6">
            <section aria-labelledby="details-title">
              <Card className="p-5">
                <h2 id="details-title" className="mb-3 text-lg font-semibold">Details</h2>
                <dl className="overflow-hidden rounded-xl border border-line">
                  <Detail label="Status"><TicketStatusPill status={t.status} /></Detail>
                  {assignable && options ? (
                    <Detail label="Developer" control>
                      <AssignControl ticket={ref} areas={options.areas} people={options.people} areaId={t.areaId ?? ""} assigneeId={t.assigneeId ?? ""} assigneeName={t.assignee?.name ?? null} />
                    </Detail>
                  ) : (
                    <Detail label="Developer"><span className={cn(!t.assignee && "font-normal text-muted-foreground")}>{t.assignee?.name ?? "Not assigned"}</span></Detail>
                  )}
                  <Detail
                    label="Category"
                    tip="Chosen when the ticket is filed. The developer can correct it once they identify the bug. Module progress on the Dashboard counts by category."
                  >
                    {canCategorize(t, me) ? (
                      <CategoryControl ticket={ref} category={t.category} />
                    ) : t.category ? (
                      CATEGORY_LABELS[t.category]
                    ) : (
                      <span className="font-normal text-muted-foreground">{NO_CATEGORY}</span>
                    )}
                  </Detail>
                  <Detail label="Module">{t.area ? areaPath(t.area) : <span className="font-normal text-muted-foreground">Module not set</span>}</Detail>
                  {t.severity ? <Detail label="Severity"><LevelLabel value={t.severity as SeverityValue} /></Detail> : null}
                  <Detail label="Priority"><LevelLabel value={t.priority} /></Detail>
                  {t.foundIn ? <Detail label="Found in">{t.foundIn}</Detail> : null}
                  {t.deviceType ? <Detail label="Device type">{DEVICE_LABELS[t.deviceType as DeviceType]}</Detail> : null}
                  <Detail label="Reported by">{t.reporter.name}</Detail>
                  <Detail label="Filed">{formatDateTime(t.createdAt)}</Detail>
                  {t.closedAt ? <Detail label="Closed">{formatDateTime(t.closedAt)}</Detail> : null}
                </dl>
              </Card>
            </section>
            <ActivityLog entries={log} />
          </aside>
        </TicketPane>
      </div>
      </TicketTabs>
    </>
  );
}

/** Every movement on the ticket with its exact time, newest first. */
function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section aria-labelledby="log-title">
      <Card>
        <h2 id="log-title" className="px-5 pt-5 pb-3 text-lg font-semibold">Activity log</h2>
        <ol className="max-h-[26.25rem] overflow-y-auto overscroll-contain pb-2" aria-label="Activity log, newest first">
          {[...entries].reverse().map((e) => (
            <li key={`${e.kind}-${e.id}`} className="border-t border-line2 px-5 py-2.5 text-[0.8438rem] leading-[1.4]">
              <strong className="font-semibold">{e.who}</strong> <span className="text-body2">{e.text}</span>
              {e.note ? <div className="mt-0.5 line-clamp-2 text-muted-foreground" title={e.note}>“{e.note}”</div> : null}
              <time className="mt-0.5 block font-mono text-[0.7813rem] text-muted-foreground tabular-nums" dateTime={e.at.toISOString()}>
                {formatDateTime(e.at)}
              </time>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}

/** A row of the Details list. The label always shows in full; only the value gives way. `control`: a value with buttons, which wraps under the label when it needs the room. */
function Detail({ label, tip, control, children }: { label: string; tip?: string; control?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-h-11 items-center justify-between gap-4 border-t border-line2 px-4 py-2 text-sm first:border-t-0", control && "flex-wrap")}>
      <dt className="flex shrink-0 items-center gap-1.5 text-body2">
        {label}
        {tip ? <InfoTip label={label} text={tip} /> : null}
      </dt>
      <dd className={cn("min-w-0 text-right font-medium wrap-anywhere", control && "flex-[1_1_10rem] text-left font-normal")}>{children}</dd>
    </div>
  );
}
