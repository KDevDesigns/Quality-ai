import { CheckIcon, FlaskConicalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The QA Hub preloader, after the DCWD ERP's Module preloader: QA Hub's emblem (a lab flask for the QA workshop, with a check) in a
// white ring that fills with water as loading goes on, inside slowly rippling rings, with waves along the bottom. The
// rings, ripples, float and waves reuse the sign-in brand pane's styles and colours (.auth-brand in globals.css).

/**
 * A wave 2000 units long that repeats every 400. Drawn 4000 px wide (.qa-splash .wave), one repeat is 800 px: exactly
 * how far auth-drift slides it, so the loop is seamless and still covers a 3200 px-wide screen. (The sign-in pane's
 * waves are only 1600 px, which leaves a gap on the right of a full-screen preloader.)
 */
const wave = (y: number, crest: number) => `M0 ${y} Q 200 ${crest} 400 ${y}${[800, 1200, 1600, 2000].map((x) => ` T ${x} ${y}`).join("")} V220 H0 Z`;

const WAVES = [
  { cls: "w1", d: wave(104, 54), fill: "var(--ab-wave-1)" },
  { cls: "w2", d: wave(146, 112), fill: "var(--ab-wave-2)" },
  { cls: "w3", d: wave(184, 164), fill: "var(--ab-wave-3)" },
];

/** A wavy water surface, twice as wide as the ring so it can slide sideways forever. */
const SLOSH = "M0 12 Q 35 2 70 12 T 140 12 T 210 12 T 280 12 T 350 12 T 420 12 T 490 12 T 560 12 V320 H0 Z";

export function Preloader({ progress, status, done, className }: { progress: number; status: string; done?: boolean; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div
      className={cn("auth-brand qa-splash fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-(--ab-bg) text-(--ab-ink)", done && "is-done", className)}
      role="progressbar"
      aria-label="Loading QA Hub"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={status}
    >
      <div className="relative z-10 -mt-16 flex flex-col items-center px-6 text-center">
        <div className="relative size-[180px]">
          <div className="absolute top-1/2 left-1/2 size-[720px] -translate-1/2 rounded-full bg-[radial-gradient(circle,var(--ab-glow)_0,color-mix(in_srgb,var(--ab-glow)_70%,transparent)_28%,transparent_62%)]" />
          <div className="absolute top-1/2 left-1/2 size-0" aria-hidden>
            {[
              [236, "var(--ab-ring-1)"],
              [330, "var(--ab-ring-2)"],
              [440, "var(--ab-ring-3)"],
              [570, "var(--ab-ring-4)"],
            ].map(([s, c]) => (
              <span key={s} className="rg" style={{ width: s, height: s, borderColor: c as string }} />
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 size-0" aria-hidden>
            <span className="rip" />
            <span className="rip" />
            <span className="rip" />
          </div>
          <div className="seal relative size-full">
            <div className="absolute inset-0 overflow-hidden rounded-full bg-white shadow-(--ab-seal-shadow)">
              <div className="water" style={{ transform: `translate3d(0, ${94 - pct * 0.86}%, 0)` }} aria-hidden>
                <svg className="slosh s2" viewBox="0 0 560 320" preserveAspectRatio="none">
                  <path d={SLOSH} fill="#4f56d3" fillOpacity={0.14} />
                </svg>
                <svg className="slosh s1" viewBox="0 0 560 320" preserveAspectRatio="none">
                  <path d={SLOSH.replaceAll(" 12", " 10").replace("Q 35 2", "Q 35 20")} fill="#4f56d3" fillOpacity={0.22} />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_6px_rgba(30,42,120,0.08)]" />
            </div>
            {/* The emblem: indigo disc, a lab flask (the QA workshop), and a green check for "verified". */}
            <div className="absolute top-1/2 left-1/2 z-[2] flex size-[124px] -translate-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_0_3px_#fff,0_6px_18px_rgba(30,42,120,0.18)]">
              <div className="flex size-[112px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f56d3,#1e2a78)] ring-4 ring-[#4f56d3]/25 ring-inset">
                <FlaskConicalIcon className="size-12 text-white" strokeWidth={1.6} aria-hidden />
              </div>
              <span className="absolute right-0.5 bottom-1.5 flex size-8 items-center justify-center rounded-full bg-[#0f9f6e] text-white shadow-[0_0_0_3px_#fff]">
                <CheckIcon className="size-4.5" strokeWidth={3} aria-hidden />
              </span>
            </div>
          </div>
        </div>

        <span className="mt-12 inline-flex h-8 items-center gap-2 rounded-full border border-(--ab-chip-line) bg-(--ab-chip-bg) px-3.5 font-mono text-[12.5px] font-semibold tracking-[0.06em] text-(--ab-chip-ink)">
          <FlaskConicalIcon className="size-4 text-(--ab-chip-icon)" aria-hidden />
          QA HUB · DCWD ERP
        </span>
        <h1 className="mt-4 text-[34px] leading-tight font-bold tracking-[-0.02em]">QA Hub</h1>
        <p className="mt-2 text-[15px] text-(--ab-text)" aria-live="polite">
          {status}
        </p>
      </div>

      {WAVES.map((w) => (
        <div key={w.cls} className="absolute inset-x-0 bottom-0 h-[220px] overflow-hidden" aria-hidden>
          <svg className={`wave ${w.cls}`} viewBox="0 0 2000 220" preserveAspectRatio="none">
            <path d={w.d} style={{ fill: w.fill }} />
          </svg>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-[26px] z-10 text-center text-[13px] text-(--ab-foot)">© Davao City Water District</div>
    </div>
  );
}
