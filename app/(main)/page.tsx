import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  ArrowRightIcon,
  BoxesIcon,
  CodeIcon,
  FlaskConicalIcon,
  MessageCircleQuestionIcon,
  RotateCcwIcon,
  TicketIcon,
  UserCheckIcon,
  UserXIcon,
  type LucideIcon,
} from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/skeletons";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { auth, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { notificationStore } from "@/lib/tickets/notifications";
import { ticketStore } from "@/lib/tickets/store";
import { cn } from "@/lib/utils";
import { TicketStatusPill, UnreadDot } from "./tickets/ticket-bits";

const tickets = ticketStore(db);
const notifications = notificationStore(db);

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Overview" description="Tickets, the conversation with developers and the module directory, in one place." />
      <Suspense fallback={<DashboardSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await connection();
  const me = await requireUser();
  // Ticket numbers cover only what this person sees: their own tickets (QA), their assignments (DEV), or all (admin).
  // Team numbers and people without a module are for whoever manages the directory; everyone else sees only their own work.
  const manager = can(me, "areas.manage");
  const [counts, recent, myAreas] = await Promise.all([
    tickets.counts(me),
    tickets.recent(me),
    db.areaMember.findMany({
      where: { userId: me.id },
      select: { isLead: true, area: { select: { name: true, parent: { select: { name: true } } } } },
    }),
  ]);
  const ticketStats = TICKET_STATS[me.role](counts);

  const { signUps, resets } = can(me, "users.manage") ? await auth.adminRequests() : { signUps: 0, resets: 0 };
  const unread = await notifications.unreadIds(me, recent.map((t) => t.id));
  const waiting = [
    signUps ? `${signUps} sign-up${signUps === 1 ? "" : "s"}` : null,
    resets ? `${resets} password reset request${resets === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <>
      {waiting.length ? (
        <InlineAlert tone="warn" role="status">
          <span className="font-semibold">
            {waiting.join(" and ")} {signUps + resets === 1 ? "is" : "are"} waiting for you.
          </span>{" "}
          <Link href="/admin/users" className="font-medium underline underline-offset-2">Review in Admin → Users</Link>
        </InlineAlert>
      ) : null}
      <StatRow stats={ticketStats} />
      <RecentTickets rows={recent} role={me.role} unread={unread} />
      {manager ? <TeamStats /> : null}

      <div className={cn("grid gap-6", manager && "lg:grid-cols-2")}>
        <Card>
          <CardHeader>
            <CardTitle>My modules</CardTitle>
            <CardDescription>{MODULES_TEXT[me.role]}</CardDescription>
            <CardAction>
              <Link href={`/team?person=${me.id}`} className="text-sm font-medium text-acc hover:underline">View in directory</Link>
            </CardAction>
          </CardHeader>
          {myAreas.length === 0 ? (
            <CardContent><p className="text-sm text-muted-foreground">You aren’t assigned to a module yet. Ask an admin to add you.</p></CardContent>
          ) : (
            <ul className="stagger">
              {myAreas.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-t border-line2 px-5 py-3 text-[0.9063rem] first:border-t-0">
                  <span className="truncate font-medium">{a.area.parent ? `${a.area.parent.name} › ` : ""}{a.area.name}</span>
                  {a.isLead ? <span className="text-[0.7813rem] font-semibold text-acc-ink">Lead</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {manager ? <NotInAnyModule /> : null}
      </div>
    </>
  );
}

const MODULES_TEXT: Record<Role, string> = {
  ADMIN: "Where you’ll receive or file tickets",
  QA: "The modules you test and file tickets for",
  DEV: "The modules you fix tickets for",
};

/** Admin only: how big the team and the module directory are. */
async function TeamStats() {
  const [qa, devs, modules, subModules] = await Promise.all([
    db.user.count({ where: { active: true, role: "QA" } }),
    db.user.count({ where: { active: true, role: "DEV" } }),
    db.erpArea.count({ where: { parentId: null, active: true } }),
    db.erpArea.count({ where: { parentId: { not: null }, active: true } }),
  ]);
  return (
    <StatRow
      stats={[
        { label: "QA testers", value: qa, href: "/team", icon: FlaskConicalIcon },
        { label: "Developers", value: devs, href: "/team", icon: CodeIcon },
        { label: "Modules", value: modules, href: "/team", icon: BoxesIcon, note: `${subModules} sub-modules` },
      ]}
    />
  );
}

/** Admin only: people nobody can send tickets to yet, with a link to fix it. */
async function NotInAnyModule() {
  const unassigned = await db.user.findMany({
    where: { active: true, role: { in: ["DEV", "QA"] }, areas: { none: {} } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserXIcon className="size-4 text-warn-ink" aria-hidden /> Not in any module
        </CardTitle>
        <CardDescription>Developers and QA with no module, so nobody knows to send them tickets</CardDescription>
        <CardAction>
          <Link href="/team" className="text-sm font-medium text-acc hover:underline">Assign</Link>
        </CardAction>
      </CardHeader>
      {unassigned.length === 0 ? (
        <CardContent><p className="text-sm text-muted-foreground">Everyone has a module.</p></CardContent>
      ) : (
        <ul className="stagger">
          {unassigned.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 border-t border-line2 px-5 py-3 text-[0.9063rem] first:border-t-0">
              <span className="truncate font-medium">{u.name}</span>
              <span className="text-[0.7813rem] text-muted-foreground">{ROLE_LABELS[u.role as Role]}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type Stat = { label: string; value: number; href: string; icon: LucideIcon; note?: string };
type Counts = Awaited<ReturnType<typeof tickets.counts>>;

/** What each person needs to act on first. */
const TICKET_STATS: Record<Role, (c: Counts) => Stat[]> = {
  ADMIN: (c) => [
    { label: "Open tickets", value: c.open, href: "/tickets", icon: TicketIcon, note: "all testers" },
    { label: "Needs info", value: c.needInfo, href: "/tickets?status=NEED_INFO", icon: MessageCircleQuestionIcon },
    { label: "Waiting for retest", value: c.fixed, href: "/tickets?status=FIXED", icon: RotateCcwIcon, note: "fixed, not yet verified" },
  ],
  QA: (c) => [
    { label: "My open tickets", value: c.open, href: "/tickets", icon: TicketIcon },
    { label: "Developer needs info", value: c.needInfo, href: "/tickets?status=NEED_INFO", icon: MessageCircleQuestionIcon, note: "answer these" },
    { label: "Ready for my retest", value: c.fixed, href: "/tickets?status=FIXED", icon: RotateCcwIcon, note: "fixed, verify them" },
  ],
  DEV: (c) => [
    { label: "Assigned to me", value: c.open, href: "/tickets", icon: UserCheckIcon, note: "open" },
    { label: "Not started", value: c.toStart, href: "/tickets", icon: TicketIcon, note: "new or reopened" },
    { label: "Waiting for QA retest", value: c.fixed, href: "/tickets?status=FIXED", icon: RotateCcwIcon },
  ],
};

function RecentTickets({ rows, role, unread }: { rows: Awaited<ReturnType<typeof tickets.recent>>; role: Role; unread: Set<string> }) {
  const now = new Date();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{role === "ADMIN" ? "Recent activity" : role === "DEV" ? "My assigned tickets" : "My tickets"}</CardTitle>
        <CardDescription>
          {role === "ADMIN" ? "The latest tickets with activity, from every tester" : role === "DEV" ? "Assigned to you, most recent activity first" : "Tickets you filed, most recent activity first"}
        </CardDescription>
        <CardAction>
          <Link href="/tickets?group=all" className="text-sm font-medium text-acc hover:underline">View all</Link>
        </CardAction>
      </CardHeader>
      {rows.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {role === "DEV" ? "Nothing is assigned to you yet." : "No tickets yet."}{" "}
            {role !== "DEV" ? <Link href="/tickets/new" className="font-medium text-acc hover:underline">File a ticket</Link> : null}
          </p>
        </CardContent>
      ) : (
        <ul className="stagger">
          {rows.map((t) => (
            <li key={t.id} className="relative flex items-center gap-3 border-t border-line2 px-5 py-3 text-[0.875rem] first:border-t-0 hover:bg-surface2">
              <span className="flex w-14 shrink-0 items-center gap-2 font-mono text-[0.8125rem] text-muted-foreground">
                #{t.number}
                {unread.has(t.id) ? <UnreadDot /> : null}
              </span>
              <Link
                href={`/tickets/${t.number}`}
                className={cn("min-w-0 flex-1 truncate after:absolute after:inset-0 hover:text-acc", unread.has(t.id) ? "font-semibold" : "font-medium")}
              >
                {t.title}
              </Link>
              <span className="hidden shrink-0 text-[0.7813rem] text-muted-foreground sm:inline">
                {role === "DEV" ? `from ${t.reporter.name}` : (t.assignee?.name ?? "Not assigned")}
              </span>
              <TicketStatusPill status={t.status} />
              <span className="hidden w-20 shrink-0 text-right text-[0.7813rem] text-muted-foreground md:inline">{timeAgo(t.lastActivityAt, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, href, icon: Icon, note }) => (
        <Link
          key={label}
          href={href}
          className="group flex items-center gap-4 rounded-xl border border-line bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 ease-(--ease-out) hover:-translate-y-0.5 hover:border-acc-b hover:shadow-[0_0.625rem_1.5rem_rgba(40,46,140,0.08)] active:translate-y-0"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.6875rem] bg-acc-t text-acc transition-transform duration-300 ease-(--ease-out) group-hover:scale-110" aria-hidden>
            <Icon className="size-[1.375rem]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.8125rem] text-muted-foreground">{label}</span>
            <span className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">{value}</span>
              {note ? <span className="text-[0.7813rem] text-muted-foreground">{note}</span> : null}
            </span>
          </span>
          <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-acc" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
