import { BugIcon, LightbulbIcon, SparklesIcon } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONES, TYPE_LABELS, TYPE_TONES, type SeverityValue, type TicketStatus, type TicketType, type TypeTone } from "@/lib/tickets/workflow";

export function TicketStatusPill({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <StatusPill tone={STATUS_TONES[status]} className={className}>
      {STATUS_LABELS[status]}
    </StatusPill>
  );
}

export const TYPE_ICON = { BUG: BugIcon, SUGGESTION: LightbulbIcon, IMPROVEMENT: SparklesIcon };

/** Each type's colour (Bug red, Suggestion amber, Improvement blue), as whole class names so Tailwind sees them. */
export const TYPE_STYLE: Record<TypeTone, { chip: string; icon: string; stripe: string; choice: string }> = {
  bug: {
    chip: "border-type-bug-b bg-type-bug-t text-type-bug",
    icon: "text-type-bug",
    stripe: "shadow-[inset_3px_0_0_var(--type-bug)]",
    choice: "has-checked:border-type-bug has-checked:bg-type-bug-t hover:border-type-bug-b",
  },
  sug: {
    chip: "border-type-sug-b bg-type-sug-t text-type-sug",
    icon: "text-type-sug",
    stripe: "shadow-[inset_3px_0_0_var(--type-sug)]",
    choice: "has-checked:border-type-sug has-checked:bg-type-sug-t hover:border-type-sug-b",
  },
  imp: {
    chip: "border-type-imp-b bg-type-imp-t text-type-imp",
    icon: "text-type-imp",
    stripe: "shadow-[inset_3px_0_0_var(--type-imp)]",
    choice: "has-checked:border-type-imp has-checked:bg-type-imp-t hover:border-type-imp-b",
  },
};

export const typeStyle = (type: TicketType) => TYPE_STYLE[TYPE_TONES[type]];

/** The ticket's type as a small chip in its colour. */
export function TicketTypeLabel({ type, className }: { type: TicketType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-px text-[12px] font-medium", typeStyle(type).chip, className)}>
      <Icon className="size-3.5" aria-hidden />
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
    <span className={cn("pop-in inline-block size-2 shrink-0 rounded-full bg-bad", className)}>
      <span className="sr-only">Unread</span>
    </span>
  );
}
