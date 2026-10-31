import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MessageSquareIcon, PlusIcon, TicketIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { nativeSelectClass } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { areaPath, buildTree } from "@/lib/areas/tree";
import { can, type Role } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { ticketFilters, type TicketFilters } from "@/lib/schemas/ticket";
import { notificationStore } from "@/lib/tickets/notifications";
import { PAGE_SIZE, ticketStore } from "@/lib/tickets/store";
import { STATUS_LABELS, TICKET_TYPES, TYPE_LABELS, type SeverityValue } from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { SeverityTag, TicketStatusPill, TicketTypeLabel, UnreadDot } from "./ticket-bits";

export const metadata: Metadata = { title: "Tickets" };

const tickets = ticketStore(db);
const notifications = notificationStore(db);

export default function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  // The header depends on who is signed in (what they see, whether they may file), so it renders inside the guard.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TicketList searchParams={searchParams} />
    </Suspense>
  );
}

const SCOPE_TEXT: Record<Role, string> = {
  ADMIN: "Every ticket from every QA tester, with the conversation for each.",
  QA: "The tickets you filed. Developers only see the tickets assigned to them.",
  DEV: "The tickets assigned to you. Fix them here and talk them through with the QA tester who filed them.",
};

function NewTicketButton() {
  return (
    <Button nativeButton={false} render={<Link href="/tickets/new" />}>
      <PlusIcon /> New ticket
    </Button>
  );
}

/** Builds a /tickets URL from the current filters with some of them changed. Page resets unless given. */
function hrefWith(f: TicketFilters, patch: Partial<Record<keyof TicketFilters, string | number | null>>): string {
  const merged: Record<string, string | number | null> = { ...f, page: null, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === null || v === "" || (k === "group" && v === "open") || (k === "page" && v === 1)) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `/tickets?${s}` : "/tickets";
}

type Quick = { label: string; patch: { group: string; status: string | null; assignee: string | null; reporter: string | null } };
const view = (label: string, group: string, status: string | null = null, assignee: string | null = null, reporter: string | null = null): Quick => ({
  label,
  patch: { group, status, assignee, reporter },
});

/** Everyone's list is already limited to their own tickets, so these only split it by stage. Admins also get "mine". */
function quickViews(role: Role): Quick[] {
  const stages = [view("Needs info", "open", "NEED_INFO"), view("Waiting for retest", "open", "FIXED"), view("Done", "done"), view("All", "all")];
  if (role === "ADMIN") return [view("Open", "open"), view("Assigned to me", "open", null, "me"), view("Reported by me", "open", null, null, "me"), ...stages];
  return [view(role === "DEV" ? "Assigned to me" : "My open tickets", "open"), ...stages];
}

async function TicketList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await connection();
  const me = await requireAction("tickets.view");
  const f = ticketFilters.parse(sp);
  const QUICK = quickViews(me.role);
  const deleted = typeof sp.deleted === "string" && /^\d+$/.test(sp.deleted) ? sp.deleted : null;

  const [{ total, rows }, areas, people] = await Promise.all([
    tickets.list(f, me),
    db.erpArea.findMany({ where: { active: true }, select: { id: true, parentId: true, name: true, sortOrder: true } }),
    db.user.findMany({ where: { active: true, role: { in: ["DEV", "ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const unread = await notifications.unreadIds(me, rows.map((t) => t.id));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date();
  const isQuick = (p: Quick["patch"]) => f.group === p.group && f.status === p.status && f.assignee === p.assignee && f.reporter === p.reporter;
  const filtered = !!(f.type || f.area || f.q || (f.assignee && f.assignee !== "me"));
  const canFile = can(me, "tickets.create");

  return (
    <>
      <PageHeader title={me.role === "ADMIN" ? "All tickets" : "My tickets"} description={SCOPE_TEXT[me.role]} actions={canFile ? <NewTicketButton /> : null} />
      {deleted ? (
        <InlineAlert tone="ok" role="status">
          Ticket #{deleted} was deleted permanently.
        </InlineAlert>
      ) : null}
      <nav aria-label="Ticket views" className="flex flex-wrap gap-1.5">
        {QUICK.map((v) => (
          <Link
            key={v.label}
            href={hrefWith(f, v.patch)}
            aria-current={isQuick(v.patch) ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
              isQuick(v.patch) ? "border-acc bg-acc text-primary-foreground" : "border-line bg-card text-ink2 hover:border-acc-b hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <form action="/tickets" className="flex flex-wrap items-end gap-2">
        {f.group !== "open" ? <input type="hidden" name="group" value={f.group} /> : null}
        {f.status ? <input type="hidden" name="status" value={f.status} /> : null}
        {f.reporter ? <input type="hidden" name="reporter" value={f.reporter} /> : null}
        <Input name="q" defaultValue={f.q} placeholder="Search title, text or #number" aria-label="Search" className="h-9 w-64 text-sm" />
        <select name="type" defaultValue={f.type ?? ""} aria-label="Type" className={cn(nativeSelectClass, "h-9 w-40 text-sm")}>
          <option value="">All types</option>
          {TICKET_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select name="area" defaultValue={f.area ?? ""} aria-label="Module" className={cn(nativeSelectClass, "h-9 w-56 text-sm")}>
          <option value="">All modules</option>
          {buildTree(areas).map((m) => (
            <optgroup key={m.id} label={m.name}>
              <option value={m.id}>{m.name} (all)</option>
              {m.children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {/* A developer's list is already "assigned to me". */}
        {me.role !== "DEV" ? (
          <select name="assignee" defaultValue={f.assignee ?? ""} aria-label="Developer" className={cn(nativeSelectClass, "h-9 w-48 text-sm")}>
            <option value="">Any developer</option>
            {me.role === "ADMIN" ? <option value="me">Me</option> : null}
            <option value="none">Not assigned</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : null}
        <Button type="submit" variant="outline" size="sm">Filter</Button>
        {filtered ? (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={hrefWith(f, { q: null, type: null, area: null, assignee: null })} />}>
            Clear
          </Button>
        ) : null}
        {f.status ? <span className="text-[13px] text-muted-foreground">Status: {STATUS_LABELS[f.status]}</span> : null}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title={total === 0 && !filtered && f.group === "open" && !f.assignee && !f.reporter && !f.status ? "No open tickets" : "Nothing matches"}
          action={canFile ? <NewTicketButton /> : null}
        >
          {filtered || f.status || f.assignee || f.reporter
            ? "Try another view or clear the filters."
            : me.role === "DEV"
              ? "Nothing is assigned to you right now. Tickets appear here when a QA tester assigns them to you."
              : "File the first one: a bug, a suggestion or an improvement."}
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-44">Developer</TableHead>
                <TableHead className="w-28 text-right">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} className="relative">
                  <TableCell className="font-mono text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      {t.number}
                      {unread.has(t.id) ? <UnreadDot /> : null}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link href={`/tickets/${t.number}`} className={cn(unread.has(t.id) ? "font-semibold" : "font-medium", "after:absolute after:inset-0 hover:text-acc")}>
                      {t.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                      <TicketTypeLabel type={t.type} />
                      <SeverityTag severity={t.severity as SeverityValue | null} />
                      {t.area ? <span>{areaPath(t.area)}</span> : null}
                      <span>by {t.reporter.name}</span>
                      {t._count.comments ? (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquareIcon className="size-3" aria-hidden /> {t._count.comments}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell><TicketStatusPill status={t.status} /></TableCell>
                  <TableCell className={cn("text-[13.5px]", !t.assignee && "text-muted-foreground")}>{t.assignee?.name ?? "Not assigned"}</TableCell>
                  <TableCell className="text-right text-[13px] text-muted-foreground" title={t.lastActivityAt.toISOString()}>
                    {timeAgo(t.lastActivityAt, now)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {total > 0 ? (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>
            {total} ticket{total === 1 ? "" : "s"}
            {pages > 1 ? ` · page ${f.page} of ${pages}` : ""}
          </span>
          {pages > 1 ? (
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={f.page <= 1} nativeButton={false} render={<Link href={hrefWith(f, { page: f.page - 1 })} aria-disabled={f.page <= 1} />}>
                <ChevronLeftIcon /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={f.page >= pages} nativeButton={false} render={<Link href={hrefWith(f, { page: f.page + 1 })} aria-disabled={f.page >= pages} />}>
                Next <ChevronRightIcon />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
