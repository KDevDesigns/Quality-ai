import Link from "next/link";
import type { HeatCell } from "@/lib/risk/score";
import { cn } from "@/lib/utils";
import { BAND_BG } from "./risk-score-badge";

export function HeatMap({
  rows,
  selected,
  hrefFor,
}: {
  rows: HeatCell[][];
  selected: { likelihood: number; impact: number } | null;
  hrefFor: (cell: HeatCell) => string;
}) {
  return (
    <figure className="grid gap-2">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="flex items-center">
          <span className="rotate-180 text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase [writing-mode:vertical-rl]">Likelihood →</span>
        </div>
        <div className="grid grid-cols-[1.25rem_repeat(5,minmax(0,1fr))] gap-1.5">
          {rows.map((row) => (
            <div key={row[0].likelihood} className="contents">
              <span className="flex items-center justify-end pr-1 font-mono text-xs text-muted-foreground">{row[0].likelihood}</span>
              {row.map((cell) => {
                const isSelected = selected?.likelihood === cell.likelihood && selected?.impact === cell.impact;
                const count = cell.riskIds.length;
                return (
                  <Link
                    key={cell.impact}
                    href={hrefFor(cell)}
                    scroll={false}
                    aria-label={`Likelihood ${cell.likelihood}, impact ${cell.impact}, score ${cell.score}: ${count} risk${count === 1 ? "" : "s"}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex aspect-[4/3] flex-col items-center justify-center rounded-lg text-foreground outline-offset-2 transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(40,46,140,0.12)] focus-visible:outline-2 focus-visible:outline-acc",
                      BAND_BG[cell.band],
                      count === 0 && "opacity-40",
                      isSelected && "outline-2 outline-acc",
                    )}
                  >
                    <span className="text-lg leading-none font-semibold tabular-nums">{count || ""}</span>
                    <span className="mt-1 font-mono text-[10px] opacity-70">{cell.score}</span>
                  </Link>
                );
              })}
            </div>
          ))}
          <span />
          {rows[0].map((cell) => (
            <span key={cell.impact} className="text-center font-mono text-xs text-muted-foreground">{cell.impact}</span>
          ))}
        </div>
      </div>
      <figcaption className="pl-8 text-center text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">Impact →</figcaption>
    </figure>
  );
}
