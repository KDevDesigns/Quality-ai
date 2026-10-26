import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ScrollTextIcon } from "lucide-react";
import { nativeSelectClass } from "@/components/form-field";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill, type Tone } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ollamaHealth, providerStatus } from "@/lib/ai";
import { formatMicroUsd, usdToMicro } from "@/lib/ai/budget";
import { getAiSettings, listAudit, monthSummary } from "@/lib/ai/store";
import { resolveRoute, ROUTES, TASK_NAMES, TASKS, type TaskDef } from "@/lib/ai/tasks";
import { cn } from "@/lib/utils";
import { BudgetForm } from "./budget-form";
import { HealthPanel } from "./health-panel";
import { RedactionForm } from "./redaction-form";
import { RoutesForm, type RouteRow } from "./routes-form";

export const metadata: Metadata = { title: "Settings" };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <>
      <PageHeader
        title="Settings"
        description="AI providers, model routing, budgets, redaction and the audit log. Sensitive data only ever goes to the local model, or is redacted first."
      />
      <Suspense fallback={<LoadingBlock />}>
        <SettingsBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const STATUS_TONE: Record<string, Tone> = { OK: "ok", ERROR: "bad", BLOCKED: "warn" };

async function SettingsBody({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await connection();
  const filter = { provider: one(sp.provider), task: one(sp.task), status: one(sp.status) };

  const [settings, ollama, summary, audit] = await Promise.all([getAiSettings(), ollamaHealth(), monthSummary(), listAudit(filter)]);
  const { anthropicKey } = providerStatus();

  const rows: RouteRow[] = TASK_NAMES.map((task) => {
    const def: TaskDef = TASKS[task];
    return { task, label: def.label, privacy: def.privacy, defaultRoute: def.route, current: resolveRoute(task, settings.routes) };
  });

  const capMicro = usdToMicro(settings.monthlyCapUsd);
  const pct = capMicro > 0 ? Math.min(100, Math.round((summary.spentMicroUsd / capMicro) * 100)) : 100;
  const filtered = Boolean(filter.provider || filter.task || filter.status);

  return (
    <>
      <section aria-labelledby="providers" className="grid gap-3">
        <h2 id="providers" className="text-xs font-semibold tracking-[0.06em] text-ink2 uppercase">Providers</h2>
        <HealthPanel initial={{ ollama, anthropicKey }} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>This month: {summary.cloudCalls} cloud call{summary.cloudCalls === 1 ? "" : "s"}, {summary.localCalls} local, {summary.blocked} blocked</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="text-2xl font-semibold tabular-nums">{formatMicroUsd(summary.spentMicroUsd)}</span>
                <span className="text-muted-foreground"> of {formatMicroUsd(capMicro)} cap</span>
              </span>
              <span className="font-mono text-[13px] text-muted-foreground">
                {summary.tokensIn.toLocaleString()} in · {summary.tokensOut.toLocaleString()} out
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface3"
              role="meter"
              aria-label="Monthly cloud spend"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className={cn("h-full rounded-full", pct >= 90 ? "bg-bad" : pct >= 70 ? "bg-warn" : "bg-acc")} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <BudgetForm cap={settings.monthlyCapUsd} maxOutputTokens={settings.maxOutputTokens} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Models per task</CardTitle>
          <CardDescription>Tasks that handle sensitive data are locked to the local model.</CardDescription>
        </CardHeader>
        <RoutesForm rows={rows} routes={ROUTES} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redaction</CardTitle>
          <CardDescription>Applied to sensitive input before any cloud call. Phones, emails, TIN, SSS/PhilHealth/Pag-IBIG/GSIS and labeled account, meter and OR numbers are always masked.</CardDescription>
        </CardHeader>
        <CardContent>
          <RedactionForm names={settings.redaction.names} patterns={settings.redaction.patterns} llmSecondPass={settings.redaction.llmSecondPass} amounts={settings.redaction.amounts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Last 200 AI calls. Metadata only; prompts and responses are never stored.</CardDescription>
        </CardHeader>
        <form action="/settings" className="flex flex-wrap items-center gap-2 border-b border-line2 px-5 py-3">
          <label htmlFor="f-provider" className="sr-only">Provider</label>
          <select id="f-provider" name="provider" defaultValue={filter.provider} className={cn(nativeSelectClass, "h-9 w-40 text-sm")}>
            <option value="">All providers</option>
            <option value="anthropic">Cloud</option>
            <option value="local">Local</option>
          </select>
          <label htmlFor="f-task" className="sr-only">Task</label>
          <select id="f-task" name="task" defaultValue={filter.task} className={cn(nativeSelectClass, "h-9 w-56 text-sm")}>
            <option value="">All tasks</option>
            {TASK_NAMES.map((t) => (
              <option key={t} value={t}>{TASKS[t].label}</option>
            ))}
          </select>
          <label htmlFor="f-status" className="sr-only">Status</label>
          <select id="f-status" name="status" defaultValue={filter.status} className={cn(nativeSelectClass, "h-9 w-36 text-sm")}>
            <option value="">All statuses</option>
            <option value="OK">OK</option>
            <option value="BLOCKED">Blocked</option>
            <option value="ERROR">Error</option>
          </select>
          <Button type="submit" variant="outline" size="sm">Filter</Button>
          {filtered ? <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/settings" />}>Clear</Button> : null}
        </form>
        {audit.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-acc-t text-acc" aria-hidden>
              <ScrollTextIcon className="size-5" />
            </span>
            <p className="text-sm font-medium">{filtered ? "No calls match these filters." : "No AI calls yet."}</p>
            <p className="max-w-sm text-[13px] text-muted-foreground">Use “Test local model” or “Test cloud model” above to make the first entry.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Privacy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-[12.5px] text-ink2">{a.at.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="text-[13.5px] font-medium">{(TASKS as Record<string, TaskDef>)[a.task]?.label ?? a.task}</div>
                    {a.error ? <div className="max-w-xs truncate text-xs text-muted-foreground" title={a.error}>{a.error}</div> : null}
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px]">{a.model}</TableCell>
                  <TableCell><StatusPill tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status}</StatusPill></TableCell>
                  <TableCell className="text-right font-mono text-[12.5px]">{a.tokensIn}+{a.tokensOut}</TableCell>
                  <TableCell className="text-right font-mono text-[12.5px]">{a.provider === "local" ? "—" : formatMicroUsd(a.costMicroUsd)}</TableCell>
                  <TableCell className="text-[12.5px]">
                    {a.sensitive ? (a.redacted ? `Redacted (${a.redactionCount})` : a.provider === "local" ? "Sensitive · local" : "Sensitive") : "Not sensitive"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
