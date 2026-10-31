import { CheckIcon, HourglassIcon, MinusIcon, PartyPopperIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Flow, FlowStep, FlowTone } from "@/lib/tickets/flow";
import { cn } from "@/lib/utils";

// The progress tracker at the top of a ticket, so QA and the developer see the same picture: which step it's on,
// when each step happened, and whose move it is.

const DOT: Record<FlowTone, string> = {
  acc: "border-acc bg-acc text-primary-foreground",
  ok: "border-ok bg-ok text-primary-foreground",
  warn: "border-warn bg-warn text-primary-foreground",
  bad: "border-bad bg-bad text-primary-foreground",
  neutral: "border-ink2 bg-ink2 text-background",
};
const RING: Record<FlowTone, string> = {
  acc: "ring-acc-t",
  ok: "ring-ok-t",
  warn: "ring-warn-t",
  bad: "ring-bad-t",
  neutral: "ring-surface3",
};
const LABEL: Record<FlowTone, string> = { acc: "text-acc", ok: "text-ok", warn: "text-warn-ink", bad: "text-bad", neutral: "text-foreground" };

function StepDot({ step, n }: { step: FlowStep; n: number }) {
  const base = "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-semibold";
  if (step.state === "done") return <span className={cn(base, DOT[step.tone])}>{step.tone === "neutral" ? <MinusIcon className="size-4" /> : <CheckIcon className="size-4" strokeWidth={3} />}</span>;
  if (step.state === "current") return <span className={cn(base, DOT[step.tone], "ring-4", RING[step.tone])}>{n}</span>;
  if (step.state === "skipped") return <span className={cn(base, "border-dashed border-line bg-card text-muted-foreground")}><MinusIcon className="size-3.5" /></span>;
  return <span className={cn(base, "border-line bg-card text-muted-foreground")}>{n}</span>;
}

export function TicketFlow({ flow, now }: { flow: Flow; now: Date }) {
  const { steps, next } = flow;
  return (
    <Card>
      <CardContent className="grid gap-4">
        <ol className="grid grid-cols-5" aria-label="Ticket progress">
          {steps.map((s, i) => {
            const lineDone = i < steps.length - 1 && steps[i + 1].state !== "upcoming" && steps[i + 1].state !== "skipped";
            return (
              <li key={s.key} className="relative grid content-start justify-items-center gap-1.5 text-center" aria-current={s.state === "current" ? "step" : undefined}>
                {i < steps.length - 1 ? (
                  <span aria-hidden className={cn("absolute top-[0.9375rem] left-1/2 h-0.5 w-full", lineDone ? "bg-acc" : "bg-line", steps[i + 1].state === "skipped" && "border-t-2 border-dashed border-line bg-transparent")} />
                ) : null}
                <StepDot step={s} n={i + 1} />
                <span
                  className={cn(
                    "px-1 text-[0.7813rem] leading-tight font-medium sm:text-[0.8438rem]",
                    s.state === "current" ? cn("font-semibold", LABEL[s.tone]) : s.state === "done" ? "text-foreground" : "text-muted-foreground",
                    s.state === "skipped" && "line-through decoration-line",
                  )}
                >
                  {s.label}
                  <span className="sr-only"> ({s.state})</span>
                </span>
                {s.at ? (
                  <time dateTime={s.at.toISOString()} title={formatDateTime(s.at)} className="hidden text-[0.7188rem] text-muted-foreground sm:block">
                    {timeAgo(s.at, now)}
                  </time>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="flex items-center gap-2 rounded-[0.625rem] bg-surface2 px-3.5 py-2.5 text-[0.8438rem]">
          {next ? (
            <>
              <HourglassIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                Waiting on <strong className="font-semibold">{next.who ?? "the developer"}</strong>
                <span className="text-muted-foreground"> ({next.side === "qa" ? "QA" : "developer"})</span> to {next.action}.
              </span>
            </>
          ) : (
            <>
              <PartyPopperIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>Finished. Nobody needs to do anything unless it&apos;s reopened.</span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
