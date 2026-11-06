"use client";

import { CheckIcon } from "lucide-react";
import { ACCENTS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { setAccent, useAccent } from "./theme";

/**
 * The theme colours as a compact row of dots, for the sign-in page (inside the app they're in the profile menu and
 * Settings). The choice is remembered in this browser and carries on after signing in.
 */
export function AccentDots({ className }: { className?: string }) {
  const accent = useAccent();
  return (
    <div role="radiogroup" aria-label="Theme colour" className={cn("flex items-center gap-1.5 rounded-full border border-line bg-card/80 p-1.5 backdrop-blur", className)}>
      {ACCENTS.map((a) => {
        const on = accent === a.key;
        return (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={a.label}
            title={a.label}
            onClick={() => setAccent(a.key)}
            className={cn(
              "flex size-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
              on && "ring-2 ring-foreground/60",
            )}
            style={{ backgroundColor: a.color }}
          >
            {on ? <CheckIcon className="size-3.5 text-white" strokeWidth={3} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
