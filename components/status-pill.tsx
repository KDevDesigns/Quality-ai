import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "bad" | "info" | "acc" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-t text-ok",
  warn: "bg-warn-t text-warn-ink",
  bad: "bg-bad-t text-bad",
  info: "bg-info-t text-info",
  acc: "bg-acc-t text-acc-ink",
  neutral: "bg-surface3 text-body2",
};

export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-[0.5625rem] text-[0.7813rem] font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
