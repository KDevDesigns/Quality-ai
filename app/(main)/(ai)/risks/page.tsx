import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ShieldAlertIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { nativeSelectClass } from "@/components/form-field";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { buildHeatMap, riskBand, type HeatCell } from "@/lib/risk/score";
import { ISO25010_CHARACTERISTICS } from "@/lib/schemas/risk";
import { cn } from "@/lib/utils";
import { requireAiWorkbench } from "@/lib/workspace";
import { deleteRisk } from "./actions";
import { HeatMap } from "./heat-map";
import { RiskDialog } from "./risk-dialog";
import { BAND_BG, RiskScoreBadge } from "./risk-score-badge";

export const metadata: Metadata = { title: "Risk register" };

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function level(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export default function RisksPage({ searchParams }: PageProps<"/risks">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <RiskRegister searchParams={searchParams} />
    </Suspense>
  );
}

async function RiskRegister({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await connection();
  await requireAiWorkbench();

  const moduleFilter = one(sp.module);
  const charFilter = one(sp.ch);
  const l = level(one(sp.l));
  const i = level(one(sp.i));
  const cell = l && i ? { likelihood: l, impact: i } : null;

  const [modules, processes, allRisks] = await Promise.all([
    db.module.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } }),
    db.businessProcess.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, moduleId: true } }),
    db.risk.findMany({
      where: charFilter ? { characteristic: charFilter } : {},
      orderBy: [{ score: "desc" }, { title: "asc" }],
      include: { module: { select: { code: true } }, process: { select: { name: true } } },
    }),
  ]);

  const risks = moduleFilter ? allRisks.filter((r) => r.moduleId === moduleFilter) : allRisks;
  const heat = buildHeatMap(risks);
  const tableRisks = cell ? risks.filter((r) => r.likelihood === cell.likelihood && r.impact === cell.impact) : risks;

  const query = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = { module: moduleFilter, ch: charFilter, l: l ? String(l) : "", i: i ? String(i) : "", ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/risks?${s}` : "/risks";
  };
  const hrefFor = (c: HeatCell) =>
    cell?.likelihood === c.likelihood && cell?.impact === c.impact
      ? query({ l: null, i: null })
      : query({ l: String(c.likelihood), i: String(c.impact) });

  const moduleOptions = modules.map((m) => ({ id: m.id, name: m.name }));
  const tabs = [
    { id: "", label: "All", count: allRisks.length },
    ...modules.map((m) => ({ id: m.id, label: m.name, count: allRisks.filter((r) => r.moduleId === m.id).length })),
  ];

  return (
    <>
      <PageHeader
        title="Risk register"
        description="Likelihood × impact per module and ISO/IEC 25010 characteristic. Higher scores get tested first."
        actions={<RiskDialog modules={moduleOptions} processes={processes} />}
      />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line">
        <nav aria-label="Filter by module" className="-mb-px flex max-w-full gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const on = t.id === moduleFilter;
            return (
              <Link
                key={t.id || "all"}
                href={query({ module: t.id || null, l: null, i: null })}
                scroll={false}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2.5 border-b-2 px-4 text-[14.5px] font-medium whitespace-nowrap transition-colors",
                  on ? "border-acc text-acc-ink" : "border-transparent text-ink2 hover:text-foreground",
                )}
              >
                {t.label}
                <b className={cn("inline-flex h-6 min-w-[30px] items-center justify-center rounded-md px-1.5 font-mono text-[12.5px] font-bold", on ? "bg-acc text-white" : "bg-surface3 text-ink2")}>
                  {t.count}
                </b>
              </Link>
            );
          })}
        </nav>
        <form action="/risks" className="flex items-center gap-2 pb-2">
          {moduleFilter ? <input type="hidden" name="module" value={moduleFilter} /> : null}
          <label htmlFor="ch" className="sr-only">Characteristic</label>
          <select id="ch" name="ch" defaultValue={charFilter} className={cn(nativeSelectClass, "h-10 w-56 text-sm")}>
            <option value="">All characteristics</option>
            {ISO25010_CHARACTERISTICS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">Apply</Button>
          {moduleFilter || charFilter || cell ? (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/risks" />}>Clear all</Button>
          ) : null}
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Heat map</CardTitle>
            <CardDescription>Click a cell to filter the table. Click it again to clear.</CardDescription>
          </CardHeader>
          <CardContent>
            <HeatMap rows={heat} selected={cell} hrefFor={hrefFor} />
            <Legend />
          </CardContent>
        </Card>

        <div className="min-w-0">
          {risks.length === 0 ? (
            <EmptyState icon={ShieldAlertIcon} title="No risks here yet" action={<RiskDialog modules={moduleOptions} processes={processes} />}>
              Record what could go wrong in this module, score it, and note which tests cover it.
            </EmptyState>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {cell ? `Likelihood ${cell.likelihood} × impact ${cell.impact}` : "All risks"}
                </CardTitle>
                <CardDescription>
                  {tableRisks.length} of {risks.length}
                  {cell ? (
                    <>
                      {" · "}
                      <Link href={query({ l: null, i: null })} className="font-medium text-acc underline-offset-2 hover:underline">Show all</Link>
                    </>
                  ) : null}
                </CardDescription>
              </CardHeader>
              {tableRisks.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">No risks match.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Score</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="hidden md:table-cell">Characteristic</TableHead>
                      <TableHead className="hidden text-center md:table-cell">L×I</TableHead>
                      <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRisks.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="align-top"><RiskScoreBadge score={r.score} band={riskBand(r.score)} /></TableCell>
                        <TableCell className="max-w-sm align-top whitespace-normal">
                          <div className="font-semibold">{r.title}</div>
                          <div className="mt-0.5 text-[13px] text-muted-foreground">
                            {r.module.code}
                            {r.process ? ` · ${r.process.name}` : ""}
                            <span className="md:hidden"> · {r.characteristic} · {r.likelihood}×{r.impact}</span>
                          </div>
                          {r.mitigation ? <div className="mt-1.5 text-[13px] text-ink2">Mitigation: {r.mitigation}</div> : null}
                        </TableCell>
                        <TableCell className="hidden align-top text-[13.5px] md:table-cell">{r.characteristic}</TableCell>
                        <TableCell className="hidden text-center align-top font-mono text-[13px] md:table-cell">{r.likelihood}×{r.impact}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end gap-0.5">
                            <RiskDialog
                              modules={moduleOptions}
                              processes={processes}
                              risk={{
                                id: r.id,
                                moduleId: r.moduleId,
                                processId: r.processId,
                                title: r.title,
                                characteristic: r.characteristic,
                                likelihood: r.likelihood,
                                impact: r.impact,
                                mitigation: r.mitigation,
                              }}
                            />
                            <DeleteButton id={r.id} label={r.title} action={deleteRisk} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Legend() {
  const items = [
    ["low", "1–4"],
    ["medium", "5–9"],
    ["high", "10–14"],
    ["critical", "15–25"],
  ] as const;
  return (
    <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line2 pt-4 text-[13px] text-muted-foreground">
      {items.map(([band, range]) => (
        <li key={band} className="flex items-center gap-1.5">
          <span className={`size-3 rounded-[3px] ${BAND_BG[band]}`} aria-hidden />
          <span className="capitalize">{band}</span> <span className="font-mono text-xs">{range}</span>
        </li>
      ))}
    </ul>
  );
}
