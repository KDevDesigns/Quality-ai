import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeftIcon, DownloadIcon, MessageCircleQuestionIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { readStringList, TECHNIQUES } from "@/lib/schemas/test-case";
import { coverage } from "@/lib/test-design/coverage";
import { requireAiWorkbench } from "@/lib/workspace";
import { deleteRequirement } from "../actions";
import { toJobStatus } from "../job-status";
import { RequirementDialog } from "../requirement-dialog";
import { CaseGrid, type CaseRow } from "./case-grid";
import { GeneratePanel } from "./generate-panel";
import { RedactionPreview } from "./redaction-preview";

export const metadata: Metadata = { title: "Requirement" };

export default function RequirementPage({ params }: PageProps<"/test-design/[id]">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Requirement params={params} />
    </Suspense>
  );
}

async function Requirement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  await requireAiWorkbench();

  const [req, modules, processes] = await Promise.all([
    db.requirement.findUnique({
      where: { id },
      include: {
        module: { select: { name: true } },
        process: { select: { name: true } },
        testCases: { orderBy: { sortOrder: "asc" } },
        generationJobs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    db.module.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true } }),
    db.businessProcess.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, moduleId: true } }),
  ]);
  if (!req) notFound();

  const cases: CaseRow[] = req.testCases.map((c) => ({
    id: c.id,
    title: c.title,
    technique: c.technique,
    priority: c.priority,
    type: c.type,
    status: c.status,
    preconditions: c.preconditions,
    steps: readStringList(c.steps),
    expected: c.expected,
    tags: readStringList(c.tags),
    processStep: c.processStep,
    openQuestions: readStringList(c.openQuestions),
    aiGenerated: c.aiGenerated,
  }));
  const cov = coverage(req.testCases);
  const questions = readStringList(req.openQuestions);
  const job = req.generationJobs[0] ? toJobStatus(req.generationJobs[0]) : null;
  const hasAiDrafts = req.testCases.some((c) => c.aiGenerated && c.status === "DRAFT");
  const exportHref = (format: string) => `/test-design/export?format=${format}&requirementId=${req.id}`;

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/test-design" />} className="-ml-2.5">
          <ArrowLeftIcon /> Test design
        </Button>
      </div>
      <PageHeader
        title={req.title || "Untitled requirement"}
        description={[req.module?.name, req.process?.name].filter(Boolean).join(" · ") || "Not linked to a module or process"}
        actions={
          <>
            <RequirementDialog
              requirement={{ id: req.id, title: req.title, text: req.text, moduleId: req.moduleId, processId: req.processId, sensitive: req.sensitive }}
              modules={modules}
              processes={processes}
            />
            <DeleteButton id={req.id} label={req.title} action={deleteRequirement} detail="Deletes the requirement with its draft and obsolete cases. Not allowed while it has approved or automated cases." />
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Requirement
            {req.sensitive ? <StatusPill tone="warn">Sensitive</StatusPill> : <StatusPill tone="neutral">Not sensitive</StatusPill>}
          </CardTitle>
          <CardDescription>
            {req.source === "upload" ? `Uploaded from ${req.sourceFile ?? "a file"}` : req.source === "seed" ? "From the seed catalog" : "Pasted"} · {req.text.length.toLocaleString("en-US")} characters
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <details className="group rounded-[10px] border border-line">
            <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-medium select-none">Show text</summary>
            <pre className="max-h-96 overflow-auto border-t border-line p-3.5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">{req.text}</pre>
          </details>
          {req.sensitive ? <RedactionPreview requirementId={req.id} /> : null}
        </CardContent>
      </Card>

      <GeneratePanel key={job?.id ?? "none"} requirementId={req.id} hasAiDrafts={hasAiDrafts} sensitive={req.sensitive} initialJob={job} />

      {questions.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleQuestionIcon className="size-[18px] text-warn-ink" aria-hidden /> Open questions for the requirement owner
            </CardTitle>
            <CardDescription>Rules the requirement doesn&apos;t state. Cases that depend on them say &ldquo;unknown&rdquo;.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="cases" className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cases" className="text-lg font-semibold">Test cases</h2>
            <p className="text-[13.5px] text-muted-foreground">
              {cov.total} case{cov.total === 1 ? "" : "s"} · {cov.approved} approved · P1 {cov.byPriority.P1} · P2 {cov.byPriority.P2} · P3 {cov.byPriority.P3} · P4 {cov.byPriority.P4}
            </p>
          </div>
          {cov.total ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={exportHref("xlsx")} download />}>
                <DownloadIcon /> XLSX
              </Button>
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={exportHref("csv")} download />}>
                <DownloadIcon /> CSV
              </Button>
            </div>
          ) : null}
        </div>

        {cov.total ? (
          <ul className="flex flex-wrap gap-2" aria-label="Cases by technique">
            {TECHNIQUES.map((t) => (
              <li key={t} className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-card px-3 text-[13px]">
                {t}
                <b className={cov.byTechnique[t] ? "font-mono text-acc-ink" : "font-mono text-muted-foreground"}>{cov.byTechnique[t]}</b>
              </li>
            ))}
          </ul>
        ) : null}
        {cov.warnings.length ? <InlineAlert tone="warn">{cov.warnings.join(" ")}</InlineAlert> : null}

        <CaseGrid requirementId={req.id} cases={cases} />
      </section>
    </>
  );
}
