import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClipboardListIcon, DownloadIcon, NetworkIcon, TriangleAlertIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { coverage } from "@/lib/test-design/coverage";
import { requireAiWorkbench } from "@/lib/workspace";
import { ImportCatalogButton } from "./import-catalog-button";
import { RequirementDialog } from "./requirement-dialog";
import { JOB_TONE, JOB_LABEL } from "./status";

export const metadata: Metadata = { title: "Test design" };

export default function TestDesignPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TestDesign />
    </Suspense>
  );
}

async function TestDesign() {
  await connection();
  await requireAiWorkbench();
  const [modules, processes, requirements] = await Promise.all([
    db.module.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true } }),
    db.businessProcess.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, moduleId: true } }),
    db.requirement.findMany({
      orderBy: [{ source: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        source: true,
        sourceFile: true,
        sensitive: true,
        module: { select: { name: true } },
        process: { select: { name: true } },
        testCases: { select: { technique: true, priority: true, status: true } },
        generationJobs: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
  ]);

  const actions = (
    <>
      <ImportCatalogButton />
      <RequirementDialog modules={modules} processes={processes} />
    </>
  );

  return (
    <>
      <PageHeader
        title="Test design"
        description="Requirements in, labeled test cases out. AI drafts stay drafts until you approve them."
        actions={actions}
      />

      {requirements.length === 0 ? (
        <EmptyState icon={ClipboardListIcon} title="No requirements yet">
          Paste or upload a requirement and let the AI draft test cases, or import the seed catalog of billing, procurement, finance and payroll scenarios.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/test-design/traceability" />}>
              <NetworkIcon /> Traceability matrix
            </Button>
            {/* Plain <a download>: these are file downloads from a route handler, which <Link> can't navigate to. */}
            <Button variant="ghost" size="sm" nativeButton={false} render={<a href="/test-design/export?format=xlsx" download />}>
              <DownloadIcon /> Export all (XLSX)
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<a href="/test-design/export?format=csv" download />}>
              <DownloadIcon /> CSV
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Module / process</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead>Last generation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((r) => {
                  const cov = coverage(r.testCases);
                  const job = r.generationJobs[0];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[420px]">
                        <Link href={`/test-design/${r.id}`} className="font-medium text-foreground hover:text-acc-ink hover:underline">
                          {r.title || "Untitled"}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          {r.sensitive ? <StatusPill tone="warn">Sensitive</StatusPill> : null}
                          <span>{r.source === "upload" ? `Upload · ${r.sourceFile ?? "file"}` : r.source === "seed" ? "Seed catalog" : "Pasted"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-ink2">
                        <div>{r.module?.name ?? "—"}</div>
                        {r.process ? <div className="text-[12.5px] text-muted-foreground">{r.process.name}</div> : null}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          {cov.warnings.length ? (
                            <TriangleAlertIcon className="size-3.5 text-warn-ink" aria-label={cov.warnings.join(" ")}>
                              <title>{cov.warnings.join(" ")}</title>
                            </TriangleAlertIcon>
                          ) : null}
                          {cov.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{cov.approved}</TableCell>
                      <TableCell>{job ? <StatusPill tone={JOB_TONE[job.status]}>{JOB_LABEL[job.status]}</StatusPill> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
