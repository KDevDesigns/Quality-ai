import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRightIcon, BoxesIcon, CodeIcon, FlaskConicalIcon, TicketIcon, UserXIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Overview" description="Tickets, the conversation with developers and the module directory, in one place." />
      <Suspense fallback={<LoadingBlock />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await connection();
  const me = await requireUser();
  const [qa, devs, modules, subModules, unassigned, myAreas] = await Promise.all([
    db.user.count({ where: { active: true, role: "QA" } }),
    db.user.count({ where: { active: true, role: "DEV" } }),
    db.erpArea.count({ where: { parentId: null, active: true } }),
    db.erpArea.count({ where: { parentId: { not: null }, active: true } }),
    db.user.findMany({ where: { active: true, role: { in: ["DEV", "QA"] }, areas: { none: {} } }, orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
    db.areaMember.findMany({
      where: { userId: me.id },
      select: { isLead: true, area: { select: { name: true, parent: { select: { name: true } } } } },
    }),
  ]);

  const stats = [
    { label: "QA testers", value: qa, href: "/team", icon: FlaskConicalIcon },
    { label: "Developers", value: devs, href: "/team", icon: CodeIcon },
    { label: "Modules", value: modules, href: "/team", icon: BoxesIcon, note: `${subModules} sub-modules` },
  ];

  return (
    <>
      <InlineAlert tone="info" role="status">
        <span className="font-semibold">Tickets are coming next.</span> Filing bugs with marked-up screenshots and videos, the conversation thread and your
        inbox arrive in the next step. For now, make sure the module directory is complete so every ticket has an owner.
      </InlineAlert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, href, icon: Icon, note }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-line bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-acc-b hover:shadow-[0_10px_24px_rgba(40,46,140,0.08)]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-acc-t text-acc" aria-hidden>
              <Icon className="size-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-muted-foreground">{label}</span>
              <span className="mt-0.5 flex items-baseline gap-2">
                <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</span>
                {note ? <span className="text-[12.5px] text-muted-foreground">{note}</span> : null}
              </span>
            </span>
            <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-acc" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My modules</CardTitle>
            <CardDescription>Where you’ll receive or file tickets</CardDescription>
            <CardAction>
              <Link href={`/team?person=${me.id}`} className="text-sm font-medium text-acc hover:underline">View in directory</Link>
            </CardAction>
          </CardHeader>
          {myAreas.length === 0 ? (
            <CardContent><p className="text-sm text-muted-foreground">You aren’t assigned to a module yet. Ask an admin to add you.</p></CardContent>
          ) : (
            <ul>
              {myAreas.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 border-t border-line2 px-5 py-3 text-[14.5px] first:border-t-0">
                  <span className="truncate font-medium">{a.area.parent ? `${a.area.parent.name} › ` : ""}{a.area.name}</span>
                  {a.isLead ? <span className="text-[12.5px] font-semibold text-acc-ink">Lead</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserXIcon className="size-4 text-warn-ink" aria-hidden /> Not in any module
            </CardTitle>
            <CardDescription>Developers and QA with no module, so nobody knows to send them tickets</CardDescription>
            {can(me, "areas.manage") ? (
              <CardAction>
                <Link href="/team" className="text-sm font-medium text-acc hover:underline">Assign</Link>
              </CardAction>
            ) : null}
          </CardHeader>
          {unassigned.length === 0 ? (
            <CardContent><p className="text-sm text-muted-foreground">Everyone has a module.</p></CardContent>
          ) : (
            <ul>
              {unassigned.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 border-t border-line2 px-5 py-3 text-[14.5px] first:border-t-0">
                  <span className="truncate font-medium">{u.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">{ROLE_LABELS[u.role as Role]}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="size-4 text-acc" aria-hidden /> Tickets
          </CardTitle>
          <CardDescription>Open tickets by status and module, each developer’s load and tickets waiting for retest will show here.</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
