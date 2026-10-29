import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeleteButton } from "@/components/delete-button";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { readSteps } from "@/lib/schemas/process";
import { requireAiWorkbench } from "@/lib/workspace";
import { deleteProcess } from "./actions";
import { ProcessDialog } from "./process-dialog";

export const metadata: Metadata = { title: "Processes" };

export default function ProcessesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Processes />
    </Suspense>
  );
}

async function Processes() {
  await connection();
  await requireAiWorkbench();
  const modules = await db.module.findMany({
    orderBy: { code: "asc" },
    include: { processes: { orderBy: { name: "asc" }, include: { _count: { select: { risks: true } } } } },
  });
  const moduleOptions = modules.map((m) => ({ id: m.id, code: m.code, name: m.name }));

  return (
    <>
      <PageHeader
        title="Business processes"
        description="End-to-end journeys the process suites protect. Coverage is measured per process, not per screen."
        actions={<ProcessDialog modules={moduleOptions} />}
      />
      {modules.map((m) => (
        <section key={m.id} className="grid gap-3" aria-labelledby={`mod-${m.code}`}>
          <h2 id={`mod-${m.code}`} className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.06em] text-ink2 uppercase after:h-px after:flex-1 after:bg-line after:content-['']">
            {m.name}
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface3 px-1.5 text-[11.5px] tracking-normal">{m.processes.length}</span>
          </h2>
          {m.processes.length === 0 ? <p className="text-sm text-muted-foreground">No processes.</p> : null}
          <div className="grid gap-4 xl:grid-cols-2">
            {m.processes.map((p) => {
              const steps = readSteps(p.steps);
              const handoffs = steps.filter((s) => s.handoff).length;
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>
                      {steps.length} steps · {handoffs} hand-off{handoffs === 1 ? "" : "s"}
                      {p._count.risks ? ` · ${p._count.risks} linked risk${p._count.risks === 1 ? "" : "s"}` : ""}
                    </CardDescription>
                    <CardAction className="flex gap-0.5">
                      <ProcessDialog
                        modules={moduleOptions}
                        process={{ id: p.id, moduleId: p.moduleId, name: p.name, description: p.description, steps }}
                      />
                      <DeleteButton id={p.id} label={p.name} action={deleteProcess} detail="Linked risks and test cases stay, but lose their link to this process." />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {p.description ? <p className="mb-4 text-[14px] text-ink2">{p.description}</p> : null}
                    <ol className="grid">
                      {steps.map((s) => (
                        <li
                          key={s.order}
                          className="relative flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pb-3.5 pl-9 text-[14px] last:pb-0 before:absolute before:top-6 before:bottom-0 before:left-[11px] before:w-0.5 before:bg-line before:content-[''] last:before:hidden"
                        >
                          <span
                            className={
                              "absolute top-0 left-0 flex size-6 items-center justify-center rounded-full font-mono text-[11.5px] font-semibold " +
                              (s.handoff ? "bg-acc text-primary-foreground" : "bg-acc-t text-acc-ink")
                            }
                            aria-hidden
                          >
                            {s.order}
                          </span>
                          <span className="sr-only">{s.order}.</span>
                          <span className="leading-6">{s.name}</span>
                          {s.handoff ? <StatusPill tone="acc">hand-off{s.module ? ` → ${s.module}` : ""}</StatusPill> : null}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
