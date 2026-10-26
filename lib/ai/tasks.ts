export const CLOUD_MODELS = ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"] as const;
export type CloudModel = (typeof CLOUD_MODELS)[number];
export type Route = "local" | CloudModel;
export const ROUTES = ["local", ...CLOUD_MODELS] as const;

/**
 * localOnly       – always the local model, whatever Settings say.
 * redactThenCloud – sensitive input is redacted before a cloud call.
 * public          – sensitive input is refused on a cloud route.
 */
export type Privacy = "localOnly" | "redactThenCloud" | "public";

export type TaskDef = {
  label: string;
  route: Route;
  privacy: Privacy;
  maxOutputTokens: number;
  timeoutMs: number;
};

export const TASKS = {
  ping_local: { label: "Health check (local)", route: "local", privacy: "localOnly", maxOutputTokens: 32, timeoutMs: 60_000 },
  ping_cloud: { label: "Health check (cloud)", route: "claude-haiku-5-5", privacy: "public", maxOutputTokens: 32, timeoutMs: 30_000 },
  redaction_check: { label: "Redaction second pass", route: "local", privacy: "localOnly", maxOutputTokens: 512, timeoutMs: 120_000 },
  classify_log: { label: "Classify log lines", route: "local", privacy: "localOnly", maxOutputTokens: 1024, timeoutMs: 120_000 },
  summarize_sensitive: { label: "Summarize billing/payroll data", route: "local", privacy: "localOnly", maxOutputTokens: 2048, timeoutMs: 180_000 },
  testcase_generation: { label: "Test case generation", route: "claude-sonnet-5-5", privacy: "redactThenCloud", maxOutputTokens: 16_000, timeoutMs: 300_000 },
  code_generation: { label: "Playwright/API code generation", route: "claude-sonnet-5-5", privacy: "public", maxOutputTokens: 16_000, timeoutMs: 300_000 },
  heal_proposal: { label: "Healer proposals", route: "claude-sonnet-5-5", privacy: "public", maxOutputTokens: 4096, timeoutMs: 120_000 },
  diff_review: { label: "Diff review and impact analysis", route: "claude-sonnet-5-5", privacy: "public", maxOutputTokens: 8192, timeoutMs: 300_000 },
  explore_step: { label: "Exploratory agent step", route: "claude-sonnet-5-5", privacy: "public", maxOutputTokens: 2048, timeoutMs: 120_000 },
  dedupe_findings: { label: "Dedupe and summarize findings", route: "claude-haiku-5-5", privacy: "redactThenCloud", maxOutputTokens: 4096, timeoutMs: 120_000 },
  bulk_tagging: { label: "Bulk tagging", route: "claude-haiku-5-5", privacy: "redactThenCloud", maxOutputTokens: 2048, timeoutMs: 120_000 },
} as const satisfies Record<string, TaskDef>;

export type TaskName = keyof typeof TASKS;
export const TASK_NAMES = Object.keys(TASKS) as TaskName[];

export function isTaskName(v: string): v is TaskName {
  return Object.hasOwn(TASKS, v);
}

/** Overrides can never move a localOnly task off the local model. */
export function resolveRoute(task: TaskName, overrides: Partial<Record<string, Route>>): Route {
  const def: TaskDef = TASKS[task];
  if (def.privacy === "localOnly") return "local";
  return overrides[task] ?? def.route;
}

export function isCloud(route: Route): route is CloudModel {
  return route !== "local";
}
