import Link from "next/link";
import { InfoTip } from "@/components/info-tip";
import type { SelectOption } from "@/components/select-field";
import { Card } from "@/components/ui/card";
import { MIN_TICKETS, progressTone, type ModuleProgress, type ProgressTone } from "@/lib/tickets/progress";
import { CATEGORY_LABELS, TICKET_CATEGORIES } from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { ModuleScope, ScoreDot } from "./module-scope";

const ABOUT = `The share of a module's tickets that are closed, for each category. A new or reopened ticket lowers it. Rejected, duplicate, won't fix and withdrawn tickets don't count, and neither do older tickets not tagged yet. Each module's dot counts all its tickets, and needs ${MIN_TICKETS} before it can reach full score. Lowest first.`;

/** One colour scale (HANDOFF D19): 0 grey, 1–29 red, 30–59 yellow, 60–89 blue, 90–100 green. */
const BAR: Record<ProgressTone, string> = { none: "bg-muted2", low: "bg-bad", mid: "bg-warn", good: "bg-level-3", done: "bg-ok" };
const INK: Record<ProgressTone, string> = { none: "text-muted-foreground", low: "text-destructive-text", mid: "text-warn-ink", good: "text-info", done: "text-ok" };

function scoreText({ done, total, pct }: { done: number; total: number; pct: number }) {
  if (total === 0) return "Score 0%: no tagged tickets yet.";
  const base = `Score ${pct}%: ${done} of ${total} closed.`;
  return total < MIN_TICKETS ? `${base} A module needs ${MIN_TICKETS} tickets before its score counts fully.` : base;
}

/**
 * Module progress: one card per module. Only numbers reach this component, never ticket text. Cards link to Tickets
 * for admins only (D6): everyone else's Tickets list holds only their own tickets, so "28 of 38" could open 3.
 */
export function ModuleProgressSection({
  cards,
  total,
  scope,
  options,
  linked,
  emptyText,
  teamLink,
}: {
  cards: ModuleProgress[];
  total: number;
  scope: string;
  options: SelectOption[];
  linked: boolean;
  emptyText: string;
  teamLink: boolean;
}) {
  return (
    <Card role="region" className="gap-4 p-5 max-md:order-1" aria-labelledby="progress-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 id="progress-title" className="text-[1.125rem] font-semibold">Module progress</h2>
          <InfoTip label="Module progress" text={ABOUT} />
        </div>
        <div className="flex items-center gap-2.5 max-sm:w-full">
          <span className="shrink-0 text-sm text-muted-foreground">
            {cards.length} of {total} module{total === 1 ? "" : "s"}
          </span>
          <ModuleScope value={scope} options={options} />
        </div>
      </div>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyText}{" "}
          {teamLink ? <Link href="/team" className="font-medium text-primary-text hover:underline">Go to Team</Link> : null}
        </p>
      ) : (
        <ul className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(21.25rem,100%),1fr))] gap-3">
          {cards.map((m) => (
            <li key={m.id} className="min-w-0">
              <ModuleProgressCard module={m} href={linked ? `/tickets?area=${m.id}&group=all` : undefined} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ModuleProgressCard({ module: m, href }: { module: ModuleProgress; href?: string }) {
  const scoreTone = progressTone(m.score.pct);
  const body = (
    <>
      <span className="mb-2.5 flex items-center gap-2">
        <ScoreDot dot={BAR[scoreTone]} text={scoreText(m.score)} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={m.name}>{m.name}</span>
        <span className={cn("shrink-0 font-mono text-sm font-semibold tabular-nums", INK[scoreTone])} aria-hidden>{m.score.pct}%</span>
      </span>
      {TICKET_CATEGORIES.map((c) => {
        const p = m.categories[c];
        const tone = progressTone(p.pct);
        return (
          <span key={c} className="grid min-h-[1.625rem] grid-cols-[4.25rem_minmax(0,1fr)_2.5rem_4rem] items-center gap-2 text-[0.8125rem]">
            <span className="text-body2">{CATEGORY_LABELS[c]}</span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-surface3" aria-hidden>
              <span className={cn("block h-full rounded-full", BAR[tone])} style={{ width: `${p.pct}%` }} />
            </span>
            <span className={cn("text-right font-mono font-semibold tabular-nums", INK[tone])}>{p.pct}%</span>
            <span className="text-right text-muted-foreground tabular-nums">
              {p.done} of {p.total}
            </span>
          </span>
        );
      })}
      {m.untagged ? <span className="mt-1.5 block truncate text-[0.8125rem] text-muted-foreground">{m.untagged} not tagged yet</span> : null}
    </>
  );
  const box = "block h-full rounded-[0.625rem] border border-line p-3.5";
  return href ? (
    <Link href={href} className={cn(box, "transition-colors hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none")}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
