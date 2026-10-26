import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { AiConfigError, AiUnavailableError, BudgetExceededError, PrivacyViolationError } from "@/lib/ai/errors";
import { runTaskWith, type AuditEntry, type RouterDeps } from "@/lib/ai/router";
import type { Route } from "@/lib/ai/tasks";
import { aiSettings, type AiSettings } from "@/lib/schemas/settings";

function reply(text: string, inputTokens = 1000, outputTokens = 200) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: inputTokens, noCache: inputTokens, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: outputTokens, text: outputTokens, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

function failing(message: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => {
      throw new Error(message);
    },
  });
}

/** Everything the given mock model was sent, as one string. */
function sent(model: MockLanguageModelV4): string {
  return JSON.stringify(model.doGenerateCalls.map((c) => c.prompt));
}

function setup(opts: {
  local?: MockLanguageModelV4;
  cloud?: MockLanguageModelV4;
  localUp?: boolean;
  spent?: number;
  settings?: Partial<AiSettings>;
  noKey?: boolean;
} = {}) {
  const local = opts.local ?? reply("local ok", 50, 5);
  const cloud = opts.cloud ?? reply("cloud ok");
  const log: AuditEntry[] = [];
  const settings = aiSettings.parse(opts.settings ?? {});
  const deps: RouterDeps = {
    getModel: (route: Route) => {
      if (route === "local") return local;
      if (opts.noKey) throw new AiConfigError("ANTHROPIC_API_KEY is not set");
      return cloud;
    },
    isLocalAvailable: async () => opts.localUp ?? true,
    localModelName: "qwen2.5-coder:7b",
    audit: {
      write: async (e) => {
        log.push(e);
      },
      cloudSpendSince: async () => opts.spent ?? 0,
    },
    settings: async () => settings,
    now: () => new Date("2026-10-26T08:00:00Z"),
  };
  return { deps, local, cloud, log };
}

const SENSITIVE_REQ = "Customer Juan Dela Cruz, Account No. 1234567, mobile 09171234567, owes ₱3,450.75.";

describe("privacy routing", () => {
  it("runs a localOnly task on the local model", async () => {
    const { deps, local, cloud, log } = setup();
    const res = await runTaskWith({ task: "summarize_sensitive", sensitive: true, input: SENSITIVE_REQ }, deps);
    expect(res.route).toBe("local");
    expect(local.doGenerateCalls).toHaveLength(1);
    expect(cloud.doGenerateCalls).toHaveLength(0);
    expect(log[0]).toMatchObject({ provider: "local", model: "qwen2.5-coder:7b", status: "OK", sensitive: true, costMicroUsd: 0 });
  });

  it("never falls back to the cloud when Ollama is down", async () => {
    const { deps, cloud, log } = setup({ localUp: false });
    await expect(runTaskWith({ task: "summarize_sensitive", sensitive: true, input: SENSITIVE_REQ }, deps)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(cloud.doGenerateCalls).toHaveLength(0);
    expect(log).toEqual([expect.objectContaining({ status: "BLOCKED", provider: "local" })]);
  });

  it("redacts sensitive input before a redactThenCloud task reaches the cloud", async () => {
    const { deps, cloud, log } = setup({ settings: { redaction: { names: ["Juan Dela Cruz"], patterns: [], llmSecondPass: false, amounts: true } } });
    const res = await runTaskWith({ task: "testcase_generation", sensitive: true, input: SENSITIVE_REQ, instructions: "Write tests for Juan Dela Cruz's bill" }, deps);
    const body = sent(cloud);
    for (const secret of ["Juan", "Dela Cruz", "1234567", "09171234567", "3,450.75"]) expect(body).not.toContain(secret);
    expect(body).toContain("[NAME_1]");
    expect(body).toContain("[ACCOUNT_1]");
    expect(res.redacted).toBe(true);
    expect(log[0]).toMatchObject({ provider: "anthropic", redacted: true, redactionCount: 5, status: "OK" });
  });

  it("does not redact non-sensitive input", async () => {
    const { deps, cloud } = setup();
    await runTaskWith({ task: "code_generation", sensitive: false, input: "Write a test for Account No. 1234567 screen" }, deps);
    expect(sent(cloud)).toContain("1234567");
  });

  it("refuses sensitive input for a public cloud task", async () => {
    const { deps, cloud, log } = setup();
    await expect(runTaskWith({ task: "code_generation", sensitive: true, input: SENSITIVE_REQ }, deps)).rejects.toBeInstanceOf(PrivacyViolationError);
    expect(cloud.doGenerateCalls).toHaveLength(0);
    expect(log[0]).toMatchObject({ status: "BLOCKED", sensitive: true });
  });

  it("allows sensitive input on a public task that Settings route to the local model", async () => {
    const { deps, local, cloud } = setup({ settings: { routes: { code_generation: "local" } } });
    await runTaskWith({ task: "code_generation", sensitive: true, input: SENSITIVE_REQ }, deps);
    expect(local.doGenerateCalls).toHaveLength(1);
    expect(cloud.doGenerateCalls).toHaveLength(0);
  });
});

describe("LLM second pass", () => {
  const settings = { redaction: { names: [], patterns: [], llmSecondPass: true, amounts: true } };

  it("redacts names the local model finds before the cloud call", async () => {
    const local = reply(JSON.stringify({ names: ["Maria Clara"] }));
    const { deps, cloud, log } = setup({ local, settings });
    await runTaskWith({ task: "testcase_generation", sensitive: true, input: "Approver Maria Clara rejected the PO." }, deps);
    expect(sent(local)).toContain("Maria Clara");
    expect(sent(cloud)).not.toContain("Maria Clara");
    expect(log.map((e) => [e.task, e.provider])).toEqual([
      ["redaction_check", "local"],
      ["testcase_generation", "anthropic"],
    ]);
  });

  it("fails closed when the local model is down", async () => {
    const { deps, cloud } = setup({ localUp: false, settings });
    await expect(runTaskWith({ task: "testcase_generation", sensitive: true, input: "Approver Maria Clara" }, deps)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(cloud.doGenerateCalls).toHaveLength(0);
  });
});

describe("budget and cost", () => {
  it("records tokens and integer micro-dollar cost for a cloud call", async () => {
    const { deps, log } = setup({ cloud: reply("ok", 1000, 200) });
    const res = await runTaskWith({ task: "code_generation", sensitive: false, input: "hi" }, deps);
    // Sonnet 5.5: 1000 * $2 + 200 * $10 per MTok = 4000 micro-dollars
    expect(res.costMicroUsd).toBe(4000);
    expect(log[0]).toMatchObject({ tokensIn: 1000, tokensOut: 200, costMicroUsd: 4000, model: "claude-sonnet-5-5" });
  });

  it("blocks cloud calls once the monthly cap is reached", async () => {
    const { deps, cloud, log } = setup({ spent: 10_000_000 });
    await expect(runTaskWith({ task: "code_generation", sensitive: false, input: "hi" }, deps)).rejects.toBeInstanceOf(BudgetExceededError);
    expect(cloud.doGenerateCalls).toHaveLength(0);
    expect(log[0].status).toBe("BLOCKED");
    expect(log[0].error).toMatch(/budget/i);
  });

  it("does not apply the cloud cap to local calls", async () => {
    const { deps, local } = setup({ spent: 99_000_000 });
    await runTaskWith({ task: "classify_log", sensitive: true, input: "ERROR at payment posting" }, deps);
    expect(local.doGenerateCalls).toHaveLength(1);
  });

  it("caps output tokens at the Settings limit", async () => {
    const { deps, cloud } = setup({ settings: { maxOutputTokens: 1000 } });
    await runTaskWith({ task: "code_generation", sensitive: false, input: "hi" }, deps);
    expect(cloud.doGenerateCalls[0].maxOutputTokens).toBe(1000);
  });
});

describe("structured output and errors", () => {
  it("validates schema output", async () => {
    const { deps } = setup({ cloud: reply(JSON.stringify({ cases: [{ title: "Tier boundary at 10 m3" }] })) });
    const schema = z.object({ cases: z.array(z.object({ title: z.string() })) });
    const res = await runTaskWith({ task: "code_generation", sensitive: false, input: "x", schema }, deps);
    expect(res.output.cases[0].title).toBe("Tier boundary at 10 m3");
  });

  it("logs a provider failure as ERROR and rethrows", async () => {
    const { deps, log } = setup({ cloud: failing("overloaded") });
    await expect(runTaskWith({ task: "code_generation", sensitive: false, input: "x" }, deps)).rejects.toThrow();
    expect(log[0]).toMatchObject({ status: "ERROR", provider: "anthropic" });
  });

  it("logs a missing API key as BLOCKED without calling anything", async () => {
    const { deps, log } = setup({ noKey: true });
    await expect(runTaskWith({ task: "ping_cloud", sensitive: false, input: "ping" }, deps)).rejects.toBeInstanceOf(AiConfigError);
    expect(log[0]).toMatchObject({ status: "BLOCKED", error: "ANTHROPIC_API_KEY is not set" });
  });

  it("never stores prompt text in the audit entry", async () => {
    const { deps, log } = setup({ cloud: failing("boom") });
    await expect(runTaskWith({ task: "code_generation", sensitive: false, input: "SECRET-PROMPT-TEXT" }, deps)).rejects.toThrow();
    expect(JSON.stringify(log)).not.toContain("SECRET-PROMPT-TEXT");
  });
});
