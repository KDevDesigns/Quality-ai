import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeftIcon, NetworkIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { loadTraceInputs } from "@/lib/test-design/store";
import { buildTraceability } from "@/lib/test-design/traceability";
import { requireAiWorkbench } from "@/lib/workspace";
import { CASE_LABEL, CASE_TONE, RESULT_LABEL, RESULT_TONE } from "../status";

export const metadata: Metadata = { title: "Traceability" };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function TraceabilityPage({ searchParams }: PageProps<"/test-design/traceability">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Traceability searchParams={searchParams} />
    </Suspense>
  );
}

async function Traceability({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await connection();
  await requireAiWorkbench();
  const moduleFilter = one(sp.module);

  const [modules, inputs] = await Promise.all([
    db.module.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true } }),
    loadTraceInputs(db, moduleFilter || undefined),
  ]);
  const rows = buildTraceability(inputs.requirements, inputs.defects);
  const totals = rows.reduce(
    (t, r) => ({ cases: t.cases + r.counts.cases, approved: t.approved + r.counts.approved, notRun: t.notRun + r.counts.notRun, openDefects: t.openDefects + r.counts.openDefects }),
    { cases: 0, approved: 0, notRun: 0, openDefects: 0 },
  );
  const tabs = [{ id: "", label: "All" }, ...modules.map((m) => ({ id: m.id, label: m.name }))];

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/test-design" />} className="-ml-2.5">
          <ArrowLeftIcon /> Test design
        </Button>
      </div>
      <PageHeader
        title="Traceability matrix"
        description="Requirement → test cases → latest result → defects. Results appear once runs start (Phase 5); defects once they're logged (Phase 9)."
      />

      <nav aria-label="Filter by module" className="-mb-px flex max-w-full gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => {
          const on = t.id === moduleFilter;
          return (
            <Link
              key={t.id || "all"}
              href={t.id ? `/test-design/traceability?module=${t.id}` : "/test-design/traceability"}
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-12 shrink-0 items-center border-b-2 px-4 text-[14.5px] font-medium whitespace-nowrap transition-colors",
                on ? "border-acc text-acc-ink" : "border-transparent text-ink2 hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState icon={NetworkIcon} title="Nothing to trace yet">Add requirements in Test design, or pick another module.</EmptyState>
      ) : (
        <>
          <p className="font-mono text-[13px] text-muted-foreground">
            {rows.length} requirements · {totals.cases} cases · {totals.approved} approved · {totals.notRun} not run · {totals.openDefects} open defects
          </p>
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Requirement</TableHead>
                  <TableHead>Test case</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latest result</TableHead>
                  <TableHead>Defects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const span = Math.max(1, r.cases.length);
                  const head = (
                    <TableCell rowSpan={span} className="border-r border-line align-top whitespace-normal">
                      <Link href={`/test-design/${r.id}`} className="font-medium hover:text-acc-ink hover:underline">
                        {r.title || "Untitled"}
                      </Link>
                      <div className="mt-1 text-[12.5px] text-muted-foreground">{r.module ?? "No module"}</div>
                      <div className="mt-1.5 font-mono text-[12px] text-ink2">
                        {r.counts.cases} cases · {r.counts.approved} approved · {r.counts.pass} pass · {r.counts.fail} fail
                      </div>
                    </TableCell>
                  );
                  if (!r.cases.length) {
                    return (
                      <TableRow key={r.id}>
                        {head}
                        <TableCell colSpan={4} className="text-sm text-bad">No test cases: this requirement is not covered.</TableCell>
                      </TableRow>
                    );
                  }
                  return r.cases.map((c, i) => (
                    <TableRow key={c.id}>
                      {i === 0 ? head : null}
                      <TableCell className="max-w-[360px] whitespace-normal text-sm">
                        <span className="mr-2 font-mono text-[12px] text-muted-foreground">{c.priority}</span>
                        {c.title}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={CASE_TONE[c.status] ?? "neutral"}>{CASE_LABEL[c.status] ?? c.status}</StatusPill>
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={RESULT_TONE[c.latest]}>{RESULT_LABEL[c.latest]}</StatusPill>
                      </TableCell>
                      <TableCell className="text-sm whitespace-normal">
                        {c.defects.length ? c.defects.map((d) => <div key={d.id}>{d.title} <span className="text-muted-foreground">({d.status.toLowerCase()})</span></div>) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
