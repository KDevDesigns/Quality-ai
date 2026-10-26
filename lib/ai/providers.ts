import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { AiConfigError } from "./errors";
import type { Route } from "./tasks";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export function localConfig() {
  return {
    baseURL: (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1").trim(),
    model: (process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b").trim(),
  };
}

/** Sensitive data goes to "local", so a misconfigured remote URL must never be treated as local. */
export function assertLoopback(baseURL: string): void {
  let host: string;
  try {
    host = new URL(baseURL).hostname;
  } catch {
    throw new AiConfigError(`OLLAMA_BASE_URL "${baseURL}" is not a valid URL.`);
  }
  if (!LOOPBACK.has(host)) {
    throw new AiConfigError(`OLLAMA_BASE_URL must point to this machine (127.0.0.1); "${host}" would send sensitive data off the laptop.`);
  }
}

export function anthropicKeyConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getModel(route: Route): LanguageModel {
  if (route === "local") {
    const { baseURL, model } = localConfig();
    assertLoopback(baseURL);
    return createOpenAICompatible({ name: "ollama", baseURL }).chatModel(model);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new AiConfigError("ANTHROPIC_API_KEY is not set in .env.local. Add an IT/DPO-approved key to enable cloud tasks.");
  }
  return createAnthropic({ apiKey })(route);
}
