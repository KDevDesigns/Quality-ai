import type { Tone } from "@/components/status-pill";

export const JOB_TONE: Record<string, Tone> = { QUEUED: "info", RUNNING: "info", DONE: "ok", ERROR: "bad" };
export const JOB_LABEL: Record<string, string> = { QUEUED: "Queued", RUNNING: "Generating", DONE: "Done", ERROR: "Failed" };

export const CASE_TONE: Record<string, Tone> = { DRAFT: "neutral", APPROVED: "ok", AUTOMATED: "acc", OBSOLETE: "warn" };
export const CASE_LABEL: Record<string, string> = { DRAFT: "Draft", APPROVED: "Approved", AUTOMATED: "Automated", OBSOLETE: "Obsolete" };

export const RESULT_TONE: Record<string, Tone> = { PASS: "ok", FAIL: "bad", FLAKY: "warn", SKIP: "neutral", NOT_RUN: "neutral" };
export const RESULT_LABEL: Record<string, string> = { PASS: "Pass", FAIL: "Fail", FLAKY: "Flaky", SKIP: "Skipped", NOT_RUN: "Not run" };
