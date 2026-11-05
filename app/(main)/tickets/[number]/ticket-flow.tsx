import { Fragment } from "react";
import { CheckIcon, MinusIcon, RotateCcwIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import type { Flow, FlowStep, FlowTone } from "@/lib/tickets/flow";
import { cn } from "@/lib/utils";
import { StepTip } from "./step-tip";

// The progress tracker at the top of a ticket, so QA and the developer see the same picture: which step it's on, when each
// step happened, and whose move it is. Laptops: one row, with the text beside each circle. Phones: five columns.

const DOT: Record<FlowTone, string> = {
  acc: "border-acc bg-acc text-primary-foreground",
  ok: "border-ok bg-ok text-on-tone",
  warn: "border-warn bg-warn text-on-tone",
  bad: "border-bad bg-bad text-on-tone",
  neutral: "border-ink2 bg-ink2 text-background",
};
const RING: Record<FlowTone, string> = {
  acc: "ring-acc-t",
  ok: "ring-ok-t",
  warn: "ring-warn-t",
  bad: "ring-bad-t",
  neutral: "ring-surface3",
};
const LABEL: Record<FlowTone, string> = { acc: "text-primary-text", ok: "text-ok", warn: "text-warn-ink", bad: "text-bad", neutral: "text-foreground" };

/** The current step on a laptop: an outlined circle. Needs info and Reopened keep their own colour; every other step is the accent. */
const CURRENT: Record<FlowTone, { circle: string; sub: string }> = {
  acc: { circle: "border-acc text-primary-text ring-acc-t", sub: "text-primary-text" },
  ok: { circle: "border-acc text-primary-text ring-acc-t", sub: "text-primary-text" },
  warn: { circle: "border-warn text-warn-ink ring-warn-t", sub: "text-warn-ink" },
  bad: { circle: "border-bad text-bad ring-bad-t", sub: "text-bad" },
  neutral: { circle: "border-ink2 text-foreground ring-surface3", sub: "text-foreground" },
};

function RowCircle({ step, n }: { step: FlowStep; n: number }) {
  const base = "flex size-8 shrink-0 items-center justify-center rounded-full text-sm";
  if (step.state === "done") {
    return step.tone === "neutral" ? (
      <span className={cn(base, "bg-surface3 text-ink2")}><MinusIcon className="size-4" aria-hidden /></span>
    ) : (
      <span className={cn(base, "bg-ok-step text-on-tone")}><CheckIcon className="size-4" strokeWidth={3} aria-hidden /></span>
    );
  }
  if (step.state === "current") return <span className={cn(base, "border-2 bg-card ring-3", CURRENT[step.tone].circle)}>{n}</span>;
  if (step.state === "skipped") return <span className={cn(base, "border border-dashed border-line bg-card text-muted-foreground")}><MinusIcon className="size-3.5" aria-hidden /></span>;
  return <span className={cn(base, "bg-surface3 text-muted-foreground")}>{n}</span>;
}

/** What hovering a step says: whose move it is on the current one, when the others happened. */
function stepTip(s: FlowStep, next: { title: string; text: string }): string {
  if (s.state === "current") return `${next.title}. ${next.text}`;
  if (s.state === "done") return s.at ? `${s.label} on ${formatDateTime(s.at)}.` : `${s.label}.`;
  if (s.state === "skipped") return "Skipped: the ticket ended before this step.";
  return "Not reached yet.";
}

/** Laptops. It scrolls sideways rather than squeezing the steps in a narrow window. Hover or focus a step for its message. */
function StepRow({ steps, next }: { steps: FlowStep[]; next: { title: string; text: string } }) {
  return (
    <div data-no-swipe className="overflow-x-auto max-md:hidden">
      <ol aria-label="Ticket progress" className="flex h-[4.25rem] min-w-[47.5rem] items-center gap-3.5 rounded-[0.875rem] border border-line bg-card px-[1.375rem] shadow-(--shadow-card)">
        {steps.map((s, i) => {
          const sub = s.at ? formatDate(s.at) : s.state === "skipped" ? "Skipped" : "Not yet";
          const after = steps[i + 1];
          return (
            <Fragment key={s.key}>
              <li className="flex shrink-0 items-center" aria-current={s.state === "current" ? "step" : undefined}>
                <StepTip text={stepTip(s, next)}>
                <RowCircle step={s} n={i + 1} />
                <span>
                  <span className={cn("block text-[0.9063rem] leading-[1.2] font-medium", s.state === "current" || s.state === "done" ? "text-foreground" : "text-body2", s.state === "skipped" && "line-through decoration-line")}>
                    {s.label}
                    <span className="sr-only"> ({s.state})</span>
                  </span>
                  {s.at ? (
                    <time dateTime={s.at.toISOString()} title={formatDateTime(s.at)} className={cn("block text-xs", s.state === "current" ? CURRENT[s.tone].sub : s.tone === "neutral" ? "text-muted-foreground" : "text-ok")}>
                      {sub}
                    </time>
                  ) : (
                    <span className="block text-xs text-muted-foreground">{sub}</span>
                  )}
                </span>
                </StepTip>
              </li>
              {after ? <li aria-hidden className={cn("h-0.5 min-w-4 flex-1 rounded-sm", s.state === "done" && after.state !== "skipped" && after.state !== "upcoming" ? "bg-ok-step" : "bg-line")} /> : null}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}

function StepDot({ step, n }: { step: FlowStep; n: number }) {
  const base = "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-semibold";
  if (step.state === "done") return <span className={cn(base, DOT[step.tone])}>{step.tone === "neutral" ? <MinusIcon className="size-4" /> : <CheckIcon className="size-4" strokeWidth={3} />}</span>;
  if (step.state === "current") return <span className={cn(base, DOT[step.tone], "ring-4", RING[step.tone])}>{n}</span>;
  if (step.state === "skipped") return <span className={cn(base, "border-dashed border-line bg-card text-muted-foreground")}><MinusIcon className="size-3.5" /></span>;
  return <span className={cn(base, "border-line bg-card text-muted-foreground")}>{n}</span>;
}

/** Phones. */
function StepColumns({ steps, now }: { steps: FlowStep[]; now: Date }) {
  return (
    <Card className="md:hidden">
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

/** Laptops show whose move it is when a step is hovered; phones can't hover, so they get the line under the steps. */
export function TicketFlow({ flow, next, now }: { flow: Flow; next: { title: string; text: string }; now: Date }) {
  return (
    <>
      <StepRow steps={flow.steps} next={next} />
      <StepColumns steps={flow.steps} now={now} />
      <div className="md:hidden">
        <NextStepLine {...next} />
      </div>
    </>
  );
}

/** Whose move it is, as one line. Phones only; laptops have it on the steps (D21). */
function NextStepLine({ title, text }: { title: string; text: string }) {
  return (
    <p className="flex items-start gap-2 px-1 text-sm text-ink2">
      <RotateCcwIcon className="mt-0.5 size-4 shrink-0 text-primary-text" aria-hidden />
      <span className="min-w-0">
        <strong className="font-semibold text-foreground">{title}.</strong> {text}
      </span>
    </p>
  );
}
