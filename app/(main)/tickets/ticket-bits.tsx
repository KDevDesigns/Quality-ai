import { BugIcon, LightbulbIcon, SparklesIcon } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONES, TYPE_LABELS, type SeverityValue, type TicketStatus, type TicketType } from "@/lib/tickets/workflow";

export function TicketStatusPill({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <StatusPill tone={STATUS_TONES[status]} className={className}>
      {STATUS_LABELS[status]}
    </StatusPill>
  );
}

const TYPE_ICON = { BUG: BugIcon, SUGGESTION: LightbulbIcon, IMPROVEMENT: SparklesIcon };

export function TicketTypeLabel({ type, className }: { type: TicketType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-ink2", className)}>
      <Icon className={cn("size-3.5", type === "BUG" ? "text-bad" : "text-acc")} aria-hidden />
      {TYPE_LABELS[type]}
    </span>
  );
}

const SEVERITY_STYLE: Record<SeverityValue, string> = {
  S1: "bg-bad text-white",
  S2: "bg-bad-t text-bad",
  S3: "bg-warn-t text-warn-ink",
  S4: "bg-surface3 text-ink2",
};

export function SeverityTag({ severity }: { severity: SeverityValue | null }) {
  if (!severity) return null;
  return <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[11.5px] font-semibold", SEVERITY_STYLE[severity])}>{severity}</span>;
}

/** The red dot on a ticket with activity you haven't opened yet. Screen readers hear "Unread". */
export function UnreadDot({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block size-2 shrink-0 rounded-full bg-bad", className)}>
      <span className="sr-only">Unread</span>
    </span>
  );
}
