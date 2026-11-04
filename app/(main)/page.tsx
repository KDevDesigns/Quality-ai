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
import { NotificationBell } from "@/components/notifications";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/skeletons";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { auth, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TIME_ZONE, timeAgo } from "@/lib/format";
import { notificationStore } from "@/lib/tickets/notifications";
import { ticketStore } from "@/lib/tickets/store";
import type { Actor } from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { TicketStatusPill, UnreadDot } from "./tickets/ticket-bits";
import { PhoneTicketList } from "./tickets/ticket-card";

const tickets = ticketStore(db);
const notifications = notificationStore(db);

export default function DashboardPage() {
  return (
    <>
      {/* Phones greet the person instead (in Overview, which knows who it is). */}
      <div className="max-md:hidden">
        <PageHeader title="Overview" description="Tickets, the conversation with developers and the module directory, in one place." />
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await connection();
  const me = await requireUser();
  const { signUps, resets } = can(me, "users.manage") ? await auth.adminRequests() : { signUps: 0, resets: 0 };
  const waiting = [
    signUps ? `${signUps} sign-up${signUps === 1 ? "" : "s"}` : null,
    resets ? `${resets} password reset request${resets === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="flex items-end justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{TODAY.format(new Date())}</p>
          <h1 className="truncate text-[2rem] leading-tight font-bold tracking-[-0.025em]">Hi, {me.name.split(/\s+/)[0]}</h1>
        </div>
        <NotificationBell />
      </div>
      {waiting.length ? (
        <InlineAlert tone="warn" role="status">
          <span className="font-semibold">
            {waiting.join(" and ")} {signUps + resets === 1 ? "is" : "are"} waiting for you.
          </span>{" "}
          <Link href="/admin/users" className="font-medium underline underline-offset-2">Review in Admin → Users</Link>
        </InlineAlert>
      ) : null}
      {me.role === "ADMIN" ? <AdminHome me={me} /> : <MyWork me={{ ...me, role: me.role }} />}
    </>
  );
}

const TODAY = new Intl.DateTimeFormat("en-PH", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });

/** Admins look after people and modules, so their Home is how big the team and directory are, and who needs a module. */
async function AdminHome({ me }: { me: Actor }) {
  const [total, qa, devs, modules, subModules] = await Promise.all([
    tickets.total(me),
    db.user.count({ where: { active: true, role: "QA" } }),
    db.user.count({ where: { active: true, role: "DEV" } }),
    db.erpArea.count({ where: { parentId: null, active: true } }),
    db.erpArea.count({ where: { parentId: { not: null }, active: true } }),
  ]);
  return (
    <>
      <StatRow
        stats={[
          { label: "Total tickets", value: total, href: "/tickets?group=all", icon: TicketIcon },
          { label: "QA testers", value: qa, href: "/team", icon: FlaskConicalIcon },
          { label: "Developers", value: devs, href: "/team", icon: CodeIcon },
          { label: "Modules", value: modules, href: "/team", icon: BoxesIcon, note: `${subModules} sub-modules` },
        ]}
      />
      <NotInAnyModule />
    </>
  );
}

/** Testers and developers see only their own work: their own tickets (QA) or their assignments (DEV). */
async function MyWork({ me }: { me: { id: string; role: WorkRole } }) {
  const [counts, recent, myAreas] = await Promise.all([
    tickets.counts(me),
    tickets.recent(me),
    db.areaMember.findMany({
      where: { userId: me.id },
      select: { isLead: true, area: { select: { name: true, parent: { select: { name: true } } } } },
    }),
  ]);
  const unread = await notifications.unreadIds(me, recent.map((t) => t.id));
  return (
    <>
      <StatRow stats={TICKET_STATS[me.role](counts)} />
      <RecentTickets rows={recent} role={me.role} unread={unread} />
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
    </>
  );
}

/** Whoever files or fixes tickets; an admin has their own Home. */
type WorkRole = Exclude<Role, "ADMIN">;

const MODULES_TEXT: Record<WorkRole, string> = {
  QA: "The modules you test and file tickets for",
  DEV: "The modules you fix tickets for",
};

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
const TICKET_STATS: Record<WorkRole, (c: Counts) => Stat[]> = {
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

function RecentTickets({ rows, role, unread }: { rows: Awaited<ReturnType<typeof tickets.recent>>; role: WorkRole; unread: Set<string> }) {
  const now = new Date();
  const title = role === "DEV" ? "My assigned tickets" : "My tickets";
  return (
    <>
    {/* Phones: a section heading over a rounded card of ticket rows. */}
    <section className="grid gap-2 md:hidden" aria-label={title}>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[0.8125rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">{title}</h2>
        <Link href="/tickets?group=all" className="text-sm font-medium text-acc-ink">See all</Link>
      </div>
      {rows.length ? (
        <PhoneTicketList
          tickets={rows.map((t) => ({ ...t, person: role === "DEV" ? `from ${t.reporter.name}` : (t.assignee?.name ?? "Not assigned") }))}
          unread={unread}
          now={now}
        />
      ) : (
        <p className="rounded-2xl bg-card px-4 py-5 text-sm text-muted-foreground">
          {role === "DEV" ? "Nothing is assigned to you yet." : "No tickets yet."}{" "}
          {role !== "DEV" ? <Link href="/tickets/new" className="font-medium text-acc-ink">File a ticket</Link> : null}
        </p>
      )}
    </section>
    <Card className="max-md:hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {role === "DEV" ? "Assigned to you, most recent activity first" : "Tickets you filed, most recent activity first"}
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
    </>
  );
}

function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <>
    {/* Phones: cards that swipe sideways, the first (the one to act on) in the accent colour. */}
    <div className="relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:hidden">
      {stats.map(({ label, value, href, icon: Icon, note }, i) => (
        <Link
          key={label}
          href={href}
          className={cn(
            "grid w-[9.5rem] shrink-0 snap-start content-start gap-2.5 rounded-[1.125rem] p-4 outline-none focus-visible:ring-3 focus-visible:ring-acc/40 active:scale-[0.98]",
            i === 0
              ? "bg-acc text-primary-foreground shadow-[0_0.5rem_1.25rem_color-mix(in_srgb,var(--acc)_35%,transparent)]"
              : "bg-card shadow-[0_0.0625rem_0.125rem_rgba(20,22,40,0.06),0_0.125rem_0.5rem_rgba(20,22,40,0.04)]",
          )}
        >
          <span className={cn("flex size-8 items-center justify-center rounded-[0.5625rem]", i === 0 ? "bg-primary-foreground/20" : "bg-acc-t text-acc-ink")} aria-hidden>
            <Icon className="size-[1.125rem]" />
          </span>
          <span className="text-[1.875rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{value}</span>
          <span className={cn("text-[0.8438rem] leading-snug font-medium", i === 0 ? "text-primary-foreground/85" : "text-ink2")}>
            {label}
            {note ? <span className="sr-only">, {note}</span> : null}
          </span>
        </Link>
      ))}
    </div>
    <div className={cn("stagger grid grid-cols-1 gap-4 max-md:hidden", stats.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3")}>
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
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">{value}</span>
              {note ? <span className="text-[0.7813rem] whitespace-nowrap text-muted-foreground">{note}</span> : null}
            </span>
          </span>
          <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-acc" aria-hidden />
        </Link>
      ))}
    </div>
    </>
  );
}
