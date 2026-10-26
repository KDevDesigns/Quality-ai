import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "bad" | "info" | "acc" | "neutral";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-t text-ok",
  warn: "bg-warn-t text-warn-ink",
  bad: "bg-bad-t text-bad",
  info: "bg-info-t text-info",
  acc: "bg-acc-t text-acc-ink",
  neutral: "bg-surface3 text-ink2",
};

/** Status pill with a leading dot in the current text color. */
export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold whitespace-nowrap before:size-[7px] before:rounded-full before:bg-current before:content-['']",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
