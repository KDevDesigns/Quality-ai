"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AiError, ollamaHealth, providerStatus, runTask } from "@/lib/ai";
import { formatMicroUsd } from "@/lib/ai/budget";
import { redact, type CustomPattern, type RedactFinding } from "@/lib/ai/redact";
import { getAiSettings, saveAiSettings } from "@/lib/ai/store";
import { ROUTES, TASK_NAMES, TASKS, type Route, type TaskDef } from "@/lib/ai/tasks";
import { fromZodError, lines, text, type FormState } from "@/lib/form";
import type { OllamaHealth } from "@/lib/ai/health";

export type HealthSnapshot = { ollama: OllamaHealth; anthropicKey: boolean };

export async function refreshHealth(): Promise<HealthSnapshot> {
  return { ollama: await ollamaHealth(true), anthropicKey: providerStatus().anthropicKey };
}

export type TestResult = { ok: boolean; message: string };

export async function testProvider(kind: "local" | "cloud"): Promise<TestResult> {
  try {
    const res = await runTask({
      task: kind === "local" ? "ping_local" : "ping_cloud",
      sensitive: false,
      input: "Reply with the single word OK.",
    });
    revalidatePath("/settings");
    const cost = kind === "cloud" ? ` · ${formatMicroUsd(res.costMicroUsd)}` : "";
    return { ok: true, message: `Answered “${res.text.trim().slice(0, 40)}” · ${res.tokensIn}+${res.tokensOut} tokens${cost}` };
  } catch (e) {
    revalidatePath("/settings");
    if (e instanceof AiError) return { ok: false, message: e.message };
    return { ok: false, message: `The provider returned an error: ${(e as Error).message.slice(0, 200)}` };
  }
}

async function save(patch: Parameters<typeof saveAiSettings>[0]): Promise<FormState> {
  try {
    await saveAiSettings(patch);
  } catch (e) {
    if (e instanceof ZodError) return fromZodError(e);
    throw e;
  }
  revalidatePath("/settings");
  return { ok: true, message: "Saved." };
}

export async function saveRoutes(_prev: FormState, fd: FormData): Promise<FormState> {
  const routes: Record<string, Route> = {};
  for (const task of TASK_NAMES) {
    const def: TaskDef = TASKS[task];
    const v = text(fd, `route_${task}`);
    if (!v || v === def.route) continue;
    if (!(ROUTES as readonly string[]).includes(v)) return { ok: false, message: `Unknown model "${v}".` };
    routes[task] = v as Route;
  }
  return save({ routes });
}

const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

export async function saveBudget(_prev: FormState, fd: FormData): Promise<FormState> {
  return save({ monthlyCapUsd: num(text(fd, "monthlyCapUsd")), maxOutputTokens: num(text(fd, "maxOutputTokens")) });
}

function parsePatterns(rows: string[]): CustomPattern[] | string {
  const out: CustomPattern[] = [];
  for (const row of rows) {
    const i = row.indexOf("=");
    if (i < 1) return `Write each pattern as LABEL = regex (problem line: "${row.slice(0, 40)}").`;
    out.push({ label: row.slice(0, i).trim(), pattern: row.slice(i + 1).trim() });
  }
  return out;
}

export async function saveRedaction(_prev: FormState, fd: FormData): Promise<FormState> {
  const patterns = parsePatterns(lines(fd, "patterns"));
  if (typeof patterns === "string") return { ok: false, message: patterns, fieldErrors: { patterns: [patterns] } };
  const current = await getAiSettings();
  return save({
    redaction: {
      ...current.redaction,
      names: lines(fd, "names"),
      patterns,
      llmSecondPass: fd.get("llmSecondPass") === "on",
      amounts: fd.get("amounts") === "on",
    },
  });
}

export type RedactionPreview = { text: string; findings: RedactFinding[]; total: number };

/** Runs only on this machine; the sample is neither logged nor sent anywhere. */
export async function previewRedaction(sample: string): Promise<RedactionPreview> {
  const s = await getAiSettings();
  const r = redact(sample.slice(0, 20_000), { names: s.redaction.names, patterns: s.redaction.patterns, amounts: s.redaction.amounts });
  return { text: r.text, findings: r.findings, total: r.total };
}
