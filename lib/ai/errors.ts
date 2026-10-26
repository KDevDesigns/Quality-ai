export type AiErrorCode = "LOCAL_UNAVAILABLE" | "CONFIG" | "BUDGET" | "PRIVACY";

/** Errors raised before any model is called; the router logs them as BLOCKED. */
export class AiError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export class AiUnavailableError extends AiError {
  constructor(message = "The local model is unavailable. Start Ollama and pull the configured model. Sensitive tasks never fall back to the cloud.") {
    super(message, "LOCAL_UNAVAILABLE");
    this.name = "AiUnavailableError";
  }
}

export class AiConfigError extends AiError {
  constructor(message: string) {
    super(message, "CONFIG");
    this.name = "AiConfigError";
  }
}

export class BudgetExceededError extends AiError {
  constructor(spentMicroUsd: number, capMicroUsd: number) {
    super(
      `Monthly cloud AI budget reached ($${(spentMicroUsd / 1e6).toFixed(2)} of $${(capMicroUsd / 1e6).toFixed(2)}). Raise the cap in Settings or wait for next month.`,
      "BUDGET",
    );
    this.name = "BudgetExceededError";
  }
}

export class PrivacyViolationError extends AiError {
  constructor(message: string) {
    super(message, "PRIVACY");
    this.name = "PrivacyViolationError";
  }
}
