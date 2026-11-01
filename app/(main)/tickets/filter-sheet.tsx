"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Phones: a round Filters button (with how many are on) that opens the ticket filters in a bottom sheet. The form itself
 * is rendered on the server and passed in, so it's the same GET form as on a laptop.
 */
export function FilterSheet({ active, children }: { active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? `Filters, ${active} on` : "Filters"}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-[0_0.0625rem_0.125rem_rgba(20,22,40,0.06),0_0.125rem_0.5rem_rgba(20,22,40,0.04)] outline-none focus-visible:ring-3 focus-visible:ring-acc/30 active:scale-95"
      >
        <SlidersHorizontalIcon className="size-5" aria-hidden />
        {active ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-acc px-1 text-[0.6875rem] font-bold text-primary-foreground ring-2 ring-grouped" aria-hidden>
            {active}
          </span>
        ) : null}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-0 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="px-0 pt-5 pb-4">
            <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
            <SheetDescription>Narrow the list by type, module or developer.</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    </>
  );
}
