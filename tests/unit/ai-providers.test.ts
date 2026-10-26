import { afterEach, describe, expect, it, vi } from "vitest";
import { AiConfigError } from "@/lib/ai/errors";
import { checkOllama } from "@/lib/ai/health";
import { assertLoopback, getModel } from "@/lib/ai/providers";

const cfg = { baseURL: "http://127.0.0.1:11434/v1", model: "qwen2.5-coder:7b" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("checkOllama", () => {
  it("reports reachable with the model pulled", async () => {
    const fetchFn = vi.fn(async () => json({ data: [{ id: "qwen2.5-coder:7b" }, { id: "llama3.1:8b" }] }));
    const h = await checkOllama(cfg, fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledWith("http://127.0.0.1:11434/v1/models", expect.anything());
    expect(h).toMatchObject({ reachable: true, modelPresent: true, error: null });
  });

  it("treats an untagged model name as :latest", async () => {
    const h = await checkOllama({ ...cfg, model: "llama3.1" }, (async () => json({ data: [{ id: "llama3.1:latest" }] })) as unknown as typeof fetch);
    expect(h.modelPresent).toBe(true);
  });

  it("explains a missing model", async () => {
    const h = await checkOllama(cfg, (async () => json({ data: [{ id: "llama3.1:8b" }] })) as unknown as typeof fetch);
    expect(h).toMatchObject({ reachable: true, modelPresent: false });
    expect(h.error).toContain("ollama pull qwen2.5-coder:7b");
  });

  it("explains when Ollama is not running", async () => {
    const h = await checkOllama(cfg, (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch);
    expect(h).toMatchObject({ reachable: false, modelPresent: false });
    expect(h.error).toMatch(/not running/);
  });

  it("reports HTTP errors", async () => {
    const h = await checkOllama(cfg, (async () => json({}, 500)) as unknown as typeof fetch);
    expect(h).toMatchObject({ reachable: false, error: "Ollama answered HTTP 500" });
  });
});

describe("providers", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it.each(["http://127.0.0.1:11434/v1", "http://localhost:11434/v1", "http://[::1]:11434/v1"])("accepts loopback %s", (url) => {
    expect(() => assertLoopback(url)).not.toThrow();
  });

  it.each(["http://192.168.1.20:11434/v1", "https://ollama.example.com/v1", "not a url"])("refuses non-local %s", (url) => {
    expect(() => assertLoopback(url)).toThrow(AiConfigError);
  });

  it("refuses a remote OLLAMA_BASE_URL when building the local model", () => {
    process.env.OLLAMA_BASE_URL = "http://10.0.0.5:11434/v1";
    expect(() => getModel("local")).toThrow(/this machine/);
  });

  it("refuses cloud models without an API key", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getModel("claude-sonnet-5-5")).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("builds models when configured", () => {
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1";
    process.env.ANTHROPIC_API_KEY = "test-key-not-real";
    expect(getModel("local")).toBeTruthy();
    expect(getModel("claude-haiku-5-5")).toBeTruthy();
  });
});
