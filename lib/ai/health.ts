export type OllamaHealth = {
  reachable: boolean;
  baseURL: string;
  model: string;
  modelPresent: boolean;
  models: string[];
  error: string | null;
};

function sameModel(a: string, b: string): boolean {
  const norm = (s: string) => (s.includes(":") ? s : `${s}:latest`);
  return norm(a) === norm(b);
}

/** Checks Ollama's OpenAI-compatible /models endpoint without sending any prompt. */
export async function checkOllama(
  cfg: { baseURL: string; model: string },
  fetchFn: typeof fetch = fetch,
  timeoutMs = 3000,
): Promise<OllamaHealth> {
  const base = { baseURL: cfg.baseURL, model: cfg.model, models: [] as string[], modelPresent: false };
  try {
    const res = await fetchFn(`${cfg.baseURL.replace(/\/+$/, "")}/models`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ...base, reachable: false, error: `Ollama answered HTTP ${res.status}` };
    const body = (await res.json()) as { data?: { id?: unknown }[] };
    const models = (body.data ?? []).map((m) => String(m.id ?? "")).filter(Boolean);
    const modelPresent = models.some((m) => sameModel(m, cfg.model));
    return {
      ...base,
      reachable: true,
      models,
      modelPresent,
      error: modelPresent ? null : `Model "${cfg.model}" is not pulled. Run: ollama pull ${cfg.model}`,
    };
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return {
      ...base,
      reachable: false,
      error: timedOut ? "Ollama did not answer within 3 seconds." : "Ollama is not running at this address. Install it and run `ollama serve`.",
    };
  }
}
