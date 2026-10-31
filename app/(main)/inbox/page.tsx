import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeftIcon, ArrowRightIcon, MessagesSquareIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { InboxSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { INBOX_PAGE, inboxStore, type InboxThread } from "@/lib/tickets/inbox";
import { ticketStore } from "@/lib/tickets/store";
import { cn } from "@/lib/utils";
import { Message, Thread, galleryImages } from "../tickets/[number]/conversation";
import { ImageGallery } from "../tickets/[number]/image-viewer";
import { MarkRead } from "../tickets/[number]/mark-read";
import { CommentForm } from "../tickets/[number]/ticket-controls";
import { TicketStatusPill, UnreadDot } from "../tickets/ticket-bits";
import { ScrollToLatest } from "@/components/scroll-to-latest";

// My inbox: the conversations on the tickets this person can see, Messenger-style. The list is on the left, the
// selected conversation (?t=<number>) on the right with a reply box. On a phone, one of the two at a time.
// Status changes, editing and assigning stay on the ticket page ("Open ticket").

export const metadata: Metadata = { title: "My inbox" };

const tickets = ticketStore(db);
const inbox = inboxStore(db);

type Params = { t: number | null; q: string; unread: boolean; n: number };

function parse(sp: Record<string, string | string[] | undefined>): Params {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const t = /^\d{1,9}$/.test(one("t")) ? Number(one("t")) : null;
  const n = /^\d{1,4}$/.test(one("n")) ? Math.min(Number(one("n")), 400) : INBOX_PAGE;
  return { t, q: one("q").slice(0, 100), unread: one("unread") === "1", n };
}

/** An /inbox URL with some parameters changed. */
function hrefWith(p: Params, patch: Partial<Params>): string {
  const m = { ...p, ...patch };
  const qs = new URLSearchParams();
  if (m.q) qs.set("q", m.q);
  if (m.unread) qs.set("unread", "1");
  if (m.n !== INBOX_PAGE) qs.set("n", String(m.n));
  if (m.t) qs.set("t", String(m.t));
  const s = qs.toString();
  return s ? `/inbox?${s}` : "/inbox";
}

export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <>
      <PageHeader title="My inbox" description="The conversations on your tickets, newest first. Replies you send here go to the ticket." />
      <Suspense fallback={<InboxSkeleton />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Inbox({ searchParams }: { searchParams: PageProps<"/inbox">["searchParams"] }) {
  const sp = await searchParams;
  await connection();
  const me = await requireAction("tickets.view");
  const p = parse(sp);

  const [{ threads, more }, t] = await Promise.all([
    inbox.threads(me, { q: p.q, unreadOnly: p.unread, take: p.n }),
    p.t ? tickets.get(p.t, me) : null,
  ]);
  // Someone else's ticket is a 404, as on the ticket page.
  if (p.t && !t) notFound();
  const now = new Date();

  return (
    <div
      data-full-width
      className="grid overflow-hidden rounded-xl border border-line bg-card lg:h-[calc(100dvh-260px)] lg:min-h-[520px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]"
    >
      {/* Conversations */}
      <section aria-label="Conversations" className={cn("min-h-0 flex-col border-line lg:flex lg:border-r", t ? "hidden" : "flex")}>
        <div className="grid gap-2.5 border-b border-line2 p-3">
          <form action="/inbox" className="flex gap-2">
            {p.unread ? <input type="hidden" name="unread" value="1" /> : null}
            <Input name="q" defaultValue={p.q} placeholder="Search title or #number" aria-label="Search conversations" className="h-9 text-sm" />
            <Button type="submit" variant="outline" size="sm">Search</Button>
          </form>
          <nav aria-label="Conversation views" className="flex gap-1.5">
            {[
              { label: "All", on: !p.unread, href: hrefWith(p, { unread: false, t: null }) },
              { label: "Unread", on: p.unread, href: hrefWith(p, { unread: true, t: null }) },
            ].map((v) => (
              <Link
                key={v.label}
                href={v.href}
                aria-current={v.on ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                  v.on ? "border-acc bg-acc text-primary-foreground" : "border-line bg-card text-ink2 hover:border-acc-b hover:text-foreground",
                )}
              >
                {v.label}
              </Link>
            ))}
          </nav>
        </div>
        {threads.length ? (
          <ul className="stagger min-h-0 flex-1 overflow-y-auto">
            {threads.map((x) => (
              <ThreadRow key={x.id} x={x} href={hrefWith(p, { t: x.number })} active={x.number === t?.number} now={now} />
            ))}
            {more ? (
              <li className="border-t border-line2 p-3 text-center">
                <Link href={hrefWith(p, { n: p.n + INBOX_PAGE })} className="text-sm font-medium text-acc hover:underline">
                  Show more
                </Link>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {p.q || p.unread ? "Nothing matches. Try All, or clear the search." : me.role === "DEV" ? "Conversations appear here when a ticket is assigned to you." : "No conversations yet."}
          </p>
        )}
      </section>

      {/* The selected conversation */}
      {t ? (
        <section aria-label={`Conversation on #${t.number}`} className="flex min-h-0 flex-col">
          <MarkRead ticketId={t.id} number={t.number} lastActivityAt={t.lastActivityAt.toISOString()} />
          <ScrollToLatest targetId="inbox-messages" endId="inbox-reply" version={t.lastActivityAt.toISOString()} />
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line2 px-4 py-3">
            <div className="min-w-0">
              <Link href={hrefWith(p, { t: null })} className="mb-1 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-acc lg:hidden">
                <ArrowLeftIcon className="size-3.5" aria-hidden /> My inbox
              </Link>
              <h2 className="truncate text-[17px] font-semibold" title={t.title}>
                <span className="mr-1.5 font-mono text-muted-foreground">#{t.number}</span>
                {t.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <TicketStatusPill status={t.status} />
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/tickets/${t.number}`} />}>
                Open ticket <ArrowRightIcon />
              </Button>
            </div>
          </header>
          <ImageGallery images={galleryImages(t)}>
            <div id="inbox-messages" className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-4">
              <Message author={t.reporter} mine={t.reporter.id === me.id} at={t.createdAt} now={now} body={t.description} files={t.attachments} />
              <Thread t={t} meId={me.id} now={now} />
            </div>
          </ImageGallery>
          <div id="inbox-reply" className="border-t border-line2 p-4">
            <CommentForm ticket={{ id: t.id, number: t.number }} />
          </div>
        </section>
      ) : (
        <div className="hidden flex-col items-center justify-center gap-2.5 p-10 text-center lg:flex">
          <span className="flex size-12 items-center justify-center rounded-full bg-acc-t text-acc" aria-hidden>
            <MessagesSquareIcon className="size-6" />
          </span>
          <p className="text-[15px] font-semibold">Pick a conversation</p>
          <p className="max-w-xs text-sm text-muted-foreground">Choose a ticket on the left to read its messages and reply.</p>
        </div>
      )}
    </div>
  );
}

function ThreadRow({ x, href, active, now }: { x: InboxThread; href: string; active: boolean; now: Date }) {
  return (
    <li className="border-b border-line2 last:border-b-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn("grid gap-1 px-4 py-3 transition-colors hover:bg-surface2", active && "bg-acc-t2 hover:bg-acc-t2")}
      >
        <span className="flex items-center gap-2">
          {x.unread ? <UnreadDot /> : null}
          <span className={cn("min-w-0 flex-1 truncate text-[14px]", x.unread ? "font-semibold" : "font-medium")}>
            <span className="mr-1.5 font-mono text-[13px] text-muted-foreground">#{x.number}</span>
            {x.title}
          </span>
          <span className="shrink-0 text-[12.5px] text-muted-foreground">{timeAgo(x.lastActivityAt, now)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", x.unread ? "text-foreground" : "text-muted-foreground")}>{x.preview}</span>
          {x.unreadMessages ? (
            <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-bad px-1 text-[11px] leading-none font-semibold text-primary-foreground">
              {x.unreadMessages > 99 ? "99+" : x.unreadMessages}
              <span className="sr-only"> unread messages</span>
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
