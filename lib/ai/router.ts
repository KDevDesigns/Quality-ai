import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { AiSettings } from "@/lib/schemas/settings";
import { costMicroUsd, monthStart, usdToMicro } from "./budget";
import { AiError, AiUnavailableError, BudgetExceededError, PrivacyViolationError } from "./errors";
import { redact } from "./redact";
import { isCloud, resolveRoute, TASKS, type Route, type TaskDef, type TaskName } from "./tasks";

export type AuditStatus = "OK" | "ERROR" | "BLOCKED";

export type AuditEntry = {
  task: TaskName;
  provider: "local" | "anthropic";
  model: string;
  status: AuditStatus;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
  durationMs: number;
  redacted: boolean;
  redactionCount: number;
  sensitive: boolean;
  error: string | null;
  jobId: string | null;
};

export interface AuditSink {
  write(entry: AuditEntry): Promise<void>;
  cloudSpendSince(since: Date): Promise<number>;
}

export type RouterDeps = {
  getModel(route: Route): LanguageModel;
  isLocalAvailable(): Promise<boolean>;
  localModelName: string;
  audit: AuditSink;
  settings(): Promise<AiSettings>;
  now(): Date;
};

export type TaskRequest<T> = {
  task: TaskName;
  input: string;
  /** True when the input holds customer/employee data, amounts tied to a person, raw DB rows, logs or credentials. */
  sensitive: boolean;
  instructions?: string;
  schema?: z.ZodType<T>;
  jobId?: string;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
};

export type TaskResult<T> = {
  output: T;
  text: string;
  route: Route;
  redacted: boolean;
  redactionCount: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
};

const NameList = z.object({ names: z.array(z.string().min(2).max(120)).max(200) });

const NAME_FINDER_INSTRUCTIONS =
  "List every personal name (people only, not companies, places or job titles) that still appears in the text. Return an empty list if there are none. Do not invent names.";

function safeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 300);
}

export async function runTaskWith<T = string>(req: TaskRequest<T>, deps: RouterDeps): Promise<TaskResult<T>> {
  const started = deps.now().getTime();
  const def: TaskDef = TASKS[req.task];
  const settings = await deps.settings();
  const route = resolveRoute(req.task, settings.routes);
  const cloud = isCloud(route);

  const entry: AuditEntry = {
    task: req.task,
    provider: cloud ? "anthropic" : "local",
    model: cloud ? route : deps.localModelName,
    status: "OK",
    tokensIn: 0,
    tokensOut: 0,
    costMicroUsd: 0,
    durationMs: 0,
    redacted: false,
    redactionCount: 0,
    sensitive: req.sensitive,
    error: null,
    jobId: req.jobId ?? null,
  };

  try {
    let prompt = req.input;
    let instructions = req.instructions;

    if (req.sensitive && cloud) {
      if (def.privacy !== "redactThenCloud") {
        throw new PrivacyViolationError(`"${def.label}" cannot send sensitive data to the cloud. Route it to the local model or mark the input non-sensitive.`);
      }
      const opts = { names: settings.redaction.names, patterns: settings.redaction.patterns, amounts: settings.redaction.amounts };
      const p = redact(prompt, opts);
      const i = instructions ? redact(instructions, opts) : null;
      prompt = p.text;
      instructions = i?.text;
      entry.redacted = true;
      entry.redactionCount = p.total + (i?.total ?? 0);

      if (settings.redaction.llmSecondPass) {
        // Fails closed: if the local model is down, the cloud call never happens.
        const found = await runTaskWith(
          { task: "redaction_check", sensitive: true, input: prompt, instructions: NAME_FINDER_INSTRUCTIONS, schema: NameList, jobId: req.jobId },
          deps,
        );
        if (found.output.names.length) {
          const second = redact(prompt, { names: found.output.names, amounts: false });
          prompt = second.text;
          entry.redactionCount += second.total;
        }
      }
    }

    if (!cloud && !(await deps.isLocalAvailable())) throw new AiUnavailableError();

    if (cloud) {
      const cap = usdToMicro(settings.monthlyCapUsd);
      const spent = await deps.audit.cloudSpendSince(monthStart(deps.now()));
      if (spent >= cap) throw new BudgetExceededError(spent, cap);
    }

    const model = deps.getModel(route);
    const maxOutputTokens = Math.min(req.maxOutputTokens ?? def.maxOutputTokens, settings.maxOutputTokens);
    const base = { model, instructions, prompt, maxOutputTokens, maxRetries: 2, timeout: def.timeoutMs, abortSignal: req.abortSignal };

    let output: T;
    let text: string;
    let usage: { inputTokens: number | undefined; outputTokens: number | undefined };
    if (req.schema) {
      const res = await generateText({ ...base, output: Output.object({ schema: req.schema }) });
      output = res.output as T;
      text = res.text;
      usage = res.usage;
    } else {
      const res = await generateText(base);
      output = res.text as T;
      text = res.text;
      usage = res.usage;
    }

    entry.tokensIn = usage.inputTokens ?? 0;
    entry.tokensOut = usage.outputTokens ?? 0;
    entry.costMicroUsd = cloud ? costMicroUsd(route, { inputTokens: entry.tokensIn, outputTokens: entry.tokensOut }) : 0;
    entry.durationMs = deps.now().getTime() - started;
    await deps.audit.write(entry);

    return {
      output,
      text,
      route,
      redacted: entry.redacted,
      redactionCount: entry.redactionCount,
      tokensIn: entry.tokensIn,
      tokensOut: entry.tokensOut,
      costMicroUsd: entry.costMicroUsd,
    };
  } catch (e) {
    entry.status = e instanceof AiError ? "BLOCKED" : "ERROR";
    entry.error = safeError(e);
    entry.durationMs = deps.now().getTime() - started;
    await deps.audit.write(entry);
    throw e;
  }
}
