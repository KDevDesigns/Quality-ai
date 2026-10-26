import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRightIcon, FolderKanbanIcon, ServerIcon, ShieldAlertIcon, WorkflowIcon } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { riskBand } from "@/lib/risk/score";
import { RiskScoreBadge } from "./risks/risk-score-badge";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Quality overview"
        description="Process coverage, run results and the release gate arrive in later phases."
      />
      <Suspense fallback={<LoadingBlock />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await connection();
  const [projects, environments, processes, riskCount, criticalCount, topRisks] = await Promise.all([
    db.project.count(),
    db.environment.findMany({ orderBy: [{ isProduction: "asc" }, { name: "asc" }], select: { id: true, name: true, isProduction: true } }),
    db.businessProcess.count(),
    db.risk.count(),
    db.risk.count({ where: { score: { gte: 15 } } }),
    db.risk.findMany({
      orderBy: [{ score: "desc" }, { title: "asc" }],
      take: 5,
      include: { module: { select: { code: true } } },
    }),
  ]);
  const stats = [
    { label: "Projects", value: projects, href: "/projects", icon: FolderKanbanIcon, note: null },
    { label: "Environments", value: environments.length, href: "/environments", icon: ServerIcon, note: null },
    { label: "Business processes", value: processes, href: "/processes", icon: WorkflowIcon, note: null },
    { label: "Risks", value: riskCount, href: "/risks", icon: ShieldAlertIcon, note: criticalCount ? `${criticalCount} critical` : null },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                {note ? <span className="text-[12.5px] font-semibold text-bad">{note}</span> : null}
              </span>
            </span>
            <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-acc" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top risks</CardTitle>
            <CardDescription>Highest likelihood × impact first</CardDescription>
            <CardAction>
              <Link href="/risks" className="text-sm font-medium text-acc hover:underline">View register</Link>
            </CardAction>
          </CardHeader>
          {topRisks.length === 0 ? (
            <CardContent><p className="text-sm text-muted-foreground">No risks recorded.</p></CardContent>
          ) : (
            <ul>
              {topRisks.map((r) => (
                <li key={r.id} className="flex items-center gap-3 border-t border-line2 px-5 py-3 text-[14.5px] first:border-t-0">
                  <RiskScoreBadge score={r.score} band={riskBand(r.score)} />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                  <Badge variant="outline">{r.module.code}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environments</CardTitle>
            <CardDescription>Production is never a test target</CardDescription>
          </CardHeader>
          <ul>
            {environments.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 border-t border-line2 px-5 py-3 text-[14.5px] first:border-t-0">
                <span className="truncate font-medium">{e.name}</span>
                {e.isProduction ? <StatusPill tone="bad">Production</StatusPill> : <StatusPill tone="ok">Test target</StatusPill>}
              </li>
            ))}
            {environments.length === 0 ? <li className="px-5 py-4 text-sm text-muted-foreground">None yet.</li> : null}
          </ul>
        </Card>
      </div>
    </>
  );
}
