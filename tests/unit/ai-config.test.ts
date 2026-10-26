import { describe, expect, it } from "vitest";
import { costMicroUsd, formatMicroUsd, monthStart, usdToMicro } from "@/lib/ai/budget";
import { resolveRoute, ROUTES, TASK_NAMES, TASKS, type TaskDef } from "@/lib/ai/tasks";
import { aiSettings, DEFAULT_AI_SETTINGS, readAiSettings } from "@/lib/schemas/settings";

describe("cost", () => {
  it.each([
    ["claude-sonnet-5-5", 1_000_000, 0, 2_000_000],
    ["claude-sonnet-5-5", 0, 1_000_000, 10_000_000],
    ["claude-haiku-5-5", 1000, 1000, 600],
    ["claude-opus-5-5", 500, 100, 4000],
  ] as const)("%s in=%i out=%i -> %i micro-USD", (model, inputTokens, outputTokens, expected) => {
    expect(costMicroUsd(model, { inputTokens, outputTokens })).toBe(expected);
  });

  it("uses the Haiku long-prompt rate above 100K input tokens", () => {
    expect(costMicroUsd("claude-haiku-5-5", { inputTokens: 100_000, outputTokens: 0 })).toBe(10_000);
    expect(costMicroUsd("claude-haiku-5-5", { inputTokens: 100_001, outputTokens: 1000 })).toBe(50_001 + 2_500);
  });

  it("returns integers and charges nothing for unknown/local models", () => {
    expect(Number.isInteger(costMicroUsd("claude-haiku-5-5", { inputTokens: 3, outputTokens: 7 }))).toBe(true);
    expect(costMicroUsd("qwen2.5-coder:7b", { inputTokens: 1e6, outputTokens: 1e6 })).toBe(0);
  });

  it("converts and formats money without floating-point drift", () => {
    expect(usdToMicro("10")).toBe(10_000_000);
    expect(usdToMicro(0.1 + 0.2)).toBe(300_000);
    expect(formatMicroUsd(4000)).toBe("$0.0040");
    expect(formatMicroUsd(12_345_678)).toBe("$12.35");
    expect(formatMicroUsd(0)).toBe("$0.00");
  });

  it("finds the start of the month", () => {
    expect(monthStart(new Date(2026, 9, 26, 15)).getTime()).toBe(new Date(2026, 9, 1).getTime());
  });
});

describe("task registry", () => {
  it("gives every task a valid route and policy", () => {
    for (const name of TASK_NAMES) {
      const t: TaskDef = TASKS[name];
      expect(ROUTES).toContain(t.route);
      expect(["localOnly", "redactThenCloud", "public"]).toContain(t.privacy);
      if (t.privacy === "localOnly") expect(t.route).toBe("local");
      expect(t.maxOutputTokens).toBeGreaterThan(0);
    }
  });

  it("ignores cloud overrides for localOnly tasks", () => {
    expect(resolveRoute("summarize_sensitive", { summarize_sensitive: "claude-opus-5-5" })).toBe("local");
    expect(resolveRoute("code_generation", { code_generation: "claude-haiku-5-5" })).toBe("claude-haiku-5-5");
    expect(resolveRoute("code_generation", {})).toBe("claude-sonnet-5-5");
  });
});

describe("AI settings schema", () => {
  it("has safe defaults", () => {
    expect(DEFAULT_AI_SETTINGS).toMatchObject({
      routes: {},
      monthlyCapUsd: 10,
      maxOutputTokens: 16_000,
      redaction: { names: [], patterns: [], llmSecondPass: false, amounts: true },
    });
  });

  it("rejects routing a localOnly task to the cloud", () => {
    const r = aiSettings.safeParse({ routes: { classify_log: "claude-sonnet-5-5" } });
    expect(r.success).toBe(false);
  });

  it("rejects unknown tasks, bad routes and invalid patterns", () => {
    expect(aiSettings.safeParse({ routes: { nope: "local" } }).success).toBe(false);
    expect(aiSettings.safeParse({ routes: { code_generation: "gpt-5" } }).success).toBe(false);
    expect(aiSettings.safeParse({ redaction: { patterns: [{ label: "x", pattern: "(" }] } }).success).toBe(false);
    expect(aiSettings.safeParse({ monthlyCapUsd: -1 }).success).toBe(false);
  });

  it("falls back to defaults when stored settings are corrupt", () => {
    expect(readAiSettings({ monthlyCapUsd: "lots" })).toEqual(DEFAULT_AI_SETTINGS);
    expect(readAiSettings(null)).toEqual(DEFAULT_AI_SETTINGS);
  });
});
