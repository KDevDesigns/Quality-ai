import { formatMicroUsd } from "@/lib/ai/budget";

export type JobStatus = {
  id: string;
  status: "QUEUED" | "RUNNING" | "DONE" | "ERROR";
  caseCount: number;
  redactionCount: number;
  tokensIn: number;
  tokensOut: number;
  cost: string;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type JobRow = Omit<JobStatus, "cost" | "createdAt" | "finishedAt"> & { costMicroUsd: number; createdAt: Date; finishedAt: Date | null };

/** Serializable job state for the polling client; cost is formatted here so the client doesn't load pricing code. */
export function toJobStatus(job: JobRow): JobStatus {
  return {
    id: job.id,
    status: job.status,
    caseCount: job.caseCount,
    redactionCount: job.redactionCount,
    tokensIn: job.tokensIn,
    tokensOut: job.tokensOut,
    cost: formatMicroUsd(job.costMicroUsd),
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
  };
}
