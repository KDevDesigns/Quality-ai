import "server-only";
import { checkOllama, type OllamaHealth } from "./health";
import { anthropicKeyConfigured, getModel, localConfig } from "./providers";
import { runTaskWith, type TaskRequest, type TaskResult } from "./router";
import { getAiSettings, prismaAuditSink } from "./store";

export { AiError } from "./errors";
export type { TaskRequest, TaskResult } from "./router";

let cached: { at: number; health: OllamaHealth } | null = null;

export async function ollamaHealth(force = false): Promise<OllamaHealth> {
  if (!force && cached && Date.now() - cached.at < 10_000) return cached.health;
  const health = await checkOllama(localConfig());
  cached = { at: Date.now(), health };
  return health;
}

/** The single entry point for every LLM call in the app (CLAUDE.md hard rule #1). */
export function runTask<T = string>(req: TaskRequest<T>): Promise<TaskResult<T>> {
  return runTaskWith(req, {
    getModel,
    isLocalAvailable: async () => {
      const h = await ollamaHealth();
      return h.reachable && h.modelPresent;
    },
    localModelName: localConfig().model,
    audit: prismaAuditSink,
    settings: getAiSettings,
    now: () => new Date(),
  });
}

export function providerStatus() {
  return { anthropicKey: anthropicKeyConfigured(), local: localConfig() };
}
