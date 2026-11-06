"use client";

import { Popover } from "@base-ui/react/popover";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCENTS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { setAccent, useAccent } from "./theme";

/**
 * The theme colour on the sign-in page: a palette button (beside the light/dark toggle) that opens the colours. A small
 * dot on the button shows the one in use. Inside the app they're in the profile menu and Settings. The choice is
 * remembered in this browser and carries on after signing in.
 */
export function AccentPicker({ className }: { className?: string }) {
  const accent = useAccent();
  const current = ACCENTS.find((a) => a.key === accent) ?? ACCENTS[0];
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={`Theme colour: ${current.label}`}
            title="Theme colour"
            className={cn("relative size-[2.375rem] rounded-[0.5625rem] text-ink2", className)}
          />
        }
      >
        <PaletteIcon className="size-[1.125rem]" aria-hidden />
        <span className="absolute right-1 bottom-1 size-2.5 rounded-full ring-2 ring-background" style={{ backgroundColor: current.color }} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="isolate z-50">
          <Popover.Popup
            aria-label="Theme colour"
            className="origin-(--transform-origin) rounded-[0.875rem] border border-line bg-popover p-3 text-popover-foreground shadow-[0_1rem_2.5rem_rgba(20,24,40,0.16)] outline-none transition-[opacity,transform] duration-200 ease-(--ease-out) data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
          >
            <div className="mb-2.5 text-xs font-semibold tracking-[0.06em] text-body2 uppercase">Theme colour</div>
            <div role="radiogroup" aria-label="Theme colour" className="flex items-center gap-2">
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
                      "flex size-8 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                      on && "ring-2 ring-foreground/60",
                    )}
                    style={{ backgroundColor: a.color }}
                  >
                    {on ? <CheckIcon className="size-4 text-white" strokeWidth={3} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[0.8125rem] text-muted-foreground">{current.label}</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
