import { z } from "zod";
import { compileCustomPattern } from "@/lib/ai/redact";
import { isTaskName, ROUTES, TASKS, type TaskDef } from "@/lib/ai/tasks";

const customPattern = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(40),
    pattern: z.string().trim().min(1, "Pattern is required").max(500),
  })
  .superRefine((p, ctx) => {
    try {
      compileCustomPattern(p);
    } catch (e) {
      ctx.addIssue({ code: "custom", message: `Invalid pattern "${p.label}": ${(e as Error).message}`, path: ["pattern"] });
    }
  });

export const redactionSettings = z.object({
  names: z.array(z.string().trim().min(2).max(120)).max(5000).default([]),
  patterns: z.array(customPattern).max(50).default([]),
  llmSecondPass: z.boolean().default(false),
  amounts: z.boolean().default(true),
});

export const aiSettings = z.object({
  routes: z
    .record(z.string(), z.enum(ROUTES))
    .default({})
    .superRefine((routes, ctx) => {
      for (const [task, route] of Object.entries(routes)) {
        if (!isTaskName(task)) ctx.addIssue({ code: "custom", message: `Unknown task "${task}"`, path: [task] });
        else if ((TASKS[task] as TaskDef).privacy === "localOnly" && route !== "local")
          ctx.addIssue({ code: "custom", message: `"${TASKS[task].label}" handles sensitive data and must stay on the local model`, path: [task] });
      }
    }),
  monthlyCapUsd: z.coerce.number().min(0, "Must be 0 or more").max(1000, "Max $1,000").default(10),
  maxOutputTokens: z.coerce.number().int().min(256).max(64_000).default(16_000),
  redaction: redactionSettings.prefault({}),
});

export type AiSettings = z.infer<typeof aiSettings>;
export const DEFAULT_AI_SETTINGS: AiSettings = aiSettings.parse({});

/** Stored settings that no longer validate fall back to safe defaults rather than crashing the router. */
export function readAiSettings(json: unknown): AiSettings {
  const r = aiSettings.safeParse(json ?? {});
  return r.success ? r.data : DEFAULT_AI_SETTINGS;
}
