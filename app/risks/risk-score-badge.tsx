import type { RiskBand } from "@/lib/risk/score";
import { cn } from "@/lib/utils";

export const BAND_BG: Record<RiskBand, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export function RiskScoreBadge({ score, band, className }: { score: number; band: RiskBand; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-[26px] min-w-[4.5rem] items-center justify-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold text-foreground", BAND_BG[band], className)}
      title={`${band} risk`}
    >
      <span className="font-mono tabular-nums">{score}</span>
      <span className="font-medium capitalize opacity-80">{band}</span>
    </span>
  );
}
