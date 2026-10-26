import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ServerIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { readBaseUrls } from "@/lib/schemas/environment";
import { cn } from "@/lib/utils";
import { deleteEnvironment } from "./actions";
import { EnvironmentDialog } from "./environment-dialog";
import { UrlTester } from "./url-tester";

export const metadata: Metadata = { title: "Environments" };

export default function EnvironmentsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Environments />
    </Suspense>
  );
}

async function Environments() {
  await connection();
  const [projects, envs] = await Promise.all([
    db.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.environment.findMany({ orderBy: [{ isProduction: "asc" }, { name: "asc" }], include: { project: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Environments"
        description="Test targets and their URL allowlists. Anything outside an environment's allowlist is refused, and production environments can never be selected."
        actions={<EnvironmentDialog projects={projects} />}
      />
      {projects.length === 0 ? <InlineAlert tone="info">Create a project first, then add its environments.</InlineAlert> : null}
      {projects.length > 0 && envs.length === 0 ? (
        <EmptyState icon={ServerIcon} title="No environments yet" action={<EnvironmentDialog projects={projects} />}>
          Add your staging ERP and the base URLs the runner is allowed to visit.
        </EmptyState>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {envs.map((e) => {
          const baseUrls = readBaseUrls(e.baseUrls);
          return (
            <Card key={e.id} className={cn(e.isProduction && "border-bad-b")}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2.5">
                  {e.name}
                  {e.isProduction ? (
                    <StatusPill tone="bad">Production · cannot be selected for runs</StatusPill>
                  ) : (
                    <StatusPill tone="ok">Test target</StatusPill>
                  )}
                </CardTitle>
                <CardDescription>{e.project.name}</CardDescription>
                <CardAction className="flex gap-0.5">
                  <EnvironmentDialog
                    projects={projects}
                    env={{
                      id: e.id,
                      projectId: e.projectId,
                      name: e.name,
                      baseUrls,
                      apiBaseUrl: e.apiBaseUrl,
                      dbConnRef: e.dbConnRef,
                      isProduction: e.isProduction,
                      notes: e.notes,
                    }}
                  />
                  <DeleteButton id={e.id} label={e.name} action={deleteEnvironment} />
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-5">
                <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-muted-foreground">Base URLs</dt>
                  <dd className="min-w-0">
                    {baseUrls.length ? (
                      <ul className="grid gap-1 font-mono text-[13px]">
                        {baseUrls.map((u) => (
                          <li key={u} className="truncate">{u}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-medium text-bad">None. Every URL will be refused.</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">API</dt>
                  <dd className="truncate font-mono text-[13px]">{e.apiBaseUrl ?? "—"}</dd>
                  <dt className="text-muted-foreground">DB ref</dt>
                  <dd className="font-mono text-[13px]">{e.dbConnRef ?? "—"}</dd>
                  {e.notes ? (
                    <>
                      <dt className="text-muted-foreground">Notes</dt>
                      <dd className="text-[13.5px] leading-relaxed text-ink2">{e.notes}</dd>
                    </>
                  ) : null}
                </dl>
                <div className="border-t border-line2 pt-4">
                  <UrlTester envId={e.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
