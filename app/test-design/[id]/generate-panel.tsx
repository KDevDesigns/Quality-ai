"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { startGeneration } from "../actions";
import type { JobStatus } from "../job-status";
import { JOB_LABEL, JOB_TONE } from "../status";

const POLL_MS = 2000;
const active = (j: JobStatus | null) => j?.status === "QUEUED" || j?.status === "RUNNING";

export function GeneratePanel({ requirementId, hasAiDrafts, sensitive, initialJob }: { requirementId: string; hasAiDrafts: boolean; sensitive: boolean; initialJob: JobStatus | null }) {
  const router = useRouter();
  const [job, setJob] = useState<JobStatus | null>(initialJob);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [replace, setReplace] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const jobId = job?.id;
  const running = active(job);

  useEffect(() => {
    if (!jobId || !running) return;
    let stop = false;
    const started = job ? new Date(job.createdAt).getTime() : Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    const poll = async () => {
      while (!stop) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (stop) return;
        try {
          const res = await fetch(`/test-design/jobs/${jobId}`, { cache: "no-store" });
          if (!res.ok) continue;
          const next = (await res.json()) as JobStatus;
          setJob(next);
          if (!active(next)) {
            if (next.status === "DONE") router.refresh(); // load the saved cases
            return;
          }
        } catch {
          // Dev server restarting; keep polling.
        }
      }
    };
    void poll();
    return () => {
      stop = true;
      clearInterval(tick);
    };
    // Re-run only when a different job starts or the running state flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, running]);

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const r = await startGeneration(requirementId, hasAiDrafts && replace);
      if (!r.ok) setStartError(r.message);
      else setJob({ id: r.jobId, status: "QUEUED", caseCount: 0, redactionCount: 0, tokensIn: 0, tokensOut: 0, cost: "$0.00", error: null, createdAt: new Date().toISOString(), finishedAt: null });
    } catch {
      setStartError("Couldn't start generation. Is the dev server running?");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="flex items-center gap-2 font-semibold">
            AI test case drafts
            {job ? <StatusPill tone={JOB_TONE[job.status]}>{JOB_LABEL[job.status]}</StatusPill> : null}
          </h2>
          <p className="text-[13.5px] text-muted-foreground">
            {sensitive ? "Sensitive: masked by the redaction rules before it reaches the cloud model." : "Sent to the cloud model as written. Mark it sensitive if it holds personal data."} Every call is in the audit log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasAiDrafts ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} disabled={running} className="size-4 accent-acc" />
              Replace unapproved AI drafts
            </label>
          ) : null}
          <Button onClick={start} disabled={starting || running}>
            <SparklesIcon /> {running ? `Generating… ${elapsed}s` : starting ? "Starting…" : hasAiDrafts ? "Generate again" : "Generate test cases"}
          </Button>
        </div>
      </div>

      {startError ? <InlineAlert tone="bad" role="alert">{startError}</InlineAlert> : null}
      {running ? (
        <InlineAlert tone="info" role="status">
          Usually takes 30–90 seconds. You can leave this page; the job keeps running.
        </InlineAlert>
      ) : null}
      {job?.status === "ERROR" && job.error ? <InlineAlert tone="bad" role="alert">{job.error}</InlineAlert> : null}
      {job?.status === "DONE" ? (
        <p className="font-mono text-[13px] text-muted-foreground" role="status">
          {job.caseCount} cases · {job.redactionCount} redaction{job.redactionCount === 1 ? "" : "s"} · {job.tokensIn.toLocaleString()} in + {job.tokensOut.toLocaleString()} out tokens · {job.cost}
        </p>
      ) : null}
    </div>
  );
}
