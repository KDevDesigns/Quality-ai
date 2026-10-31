"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { addDays, addMonths, monthGrid, MONTHS, parseIsoDate, todayInManila, WEEKDAYS } from "@/lib/calendar";
import { cn } from "@/lib/utils";

// A date picker in QA Hub's style, in place of the browser's own: `trigger` opens a small month calendar. Dates are
// "YYYY-MM-DD". Arrow keys move a day or a week, Page Up/Down a month, Enter picks, Escape closes.

export function DatePicker({
  value,
  onChange,
  trigger,
  label = "Pick a date",
}: {
  value: string;
  onChange: (date: string) => void;
  /** The element that opens the calendar (a button). */
  trigger: React.ReactElement;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = todayInManila();
  const [focus, setFocus] = useState(value || today);
  const shown = parseIsoDate(focus) ?? parseIsoDate(today)!;
  const [view, setView] = useState({ y: shown.y, m: shown.m });

  function moveTo(date: string) {
    const p = parseIsoDate(date);
    if (!p) return;
    setFocus(date);
    setView({ y: p.y, m: p.m });
  }

  function pick(date: string) {
    onChange(date);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step) {
      e.preventDefault();
      moveTo(addDays(focus, step));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const p = parseIsoDate(focus)!;
      const next = addMonths(p.y, p.m, e.key === "PageUp" ? -1 : 1);
      moveTo(`${next.y}-${String(next.m).padStart(2, "0")}-${String(Math.min(p.d, 28)).padStart(2, "0")}`);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focus);
    }
  }

  const days = monthGrid(view.y, view.m);
  const step = (n: number) => setView(addMonths(view.y, view.m, n));

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) moveTo(value || today);
        setOpen(next);
      }}
    >
      <Popover.Trigger render={trigger} />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="isolate z-50">
          <Popover.Popup
            aria-label={label}
            className="w-[300px] origin-(--transform-origin) rounded-[14px] border border-line bg-popover p-3 text-popover-foreground shadow-[0_16px_40px_rgba(20,24,40,0.16)] outline-none transition-[opacity,transform] duration-200 ease-(--ease-out) data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
          >
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => step(-1)} aria-label="Previous month" className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink2 transition-colors hover:bg-acc-t2 hover:text-foreground">
                <ChevronLeftIcon className="size-4" />
              </button>
              <span key={`${view.y}-${view.m}`} className="pop-in text-sm font-semibold" aria-live="polite">
                {MONTHS[view.m - 1]} {view.y}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Next month" className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink2 transition-colors hover:bg-acc-t2 hover:text-foreground">
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
            <div role="grid" aria-label={`${MONTHS[view.m - 1]} ${view.y}`} tabIndex={0} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-0.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-acc/20">
              {WEEKDAYS.map((d) => (
                <span key={d} className="pb-1 text-center text-[11.5px] font-semibold text-muted-foreground" aria-hidden>
                  {d}
                </span>
              ))}
              {days.map((d) => {
                const chosen = d.date === value;
                return (
                  <button
                    key={d.date}
                    type="button"
                    tabIndex={-1}
                    role="gridcell"
                    aria-selected={chosen}
                    aria-label={d.date}
                    onClick={() => pick(d.date)}
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center rounded-lg text-[13.5px] tabular-nums transition-[background-color,color,transform] duration-150 active:scale-95",
                      !d.inMonth && "text-muted-foreground/60",
                      chosen ? "bg-acc font-semibold text-primary-foreground shadow-[0_3px_10px_color-mix(in_srgb,var(--acc)_35%,transparent)]" : "hover:bg-acc-t",
                      !chosen && d.date === today && "font-semibold text-acc ring-1 ring-acc-b ring-inset",
                      !chosen && d.date === focus && "bg-acc-t2 ring-2 ring-acc/40 ring-inset",
                    )}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between border-t border-line2 pt-2">
              <button type="button" onClick={() => pick(today)} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-acc transition-colors hover:bg-acc-t2">
                Today
              </button>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-surface2 hover:text-foreground">
                Close
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
