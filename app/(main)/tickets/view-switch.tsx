"use client";

import Link from "next/link";
import { ListIcon, SquareKanbanIcon } from "lucide-react";
import { TICKETS_VIEW_COOKIE, type TicketView } from "@/lib/tickets/board";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "list", label: "List", icon: ListIcon },
  { value: "board", label: "Board", icon: SquareKanbanIcon },
] as const;

/** Kept for a year in this browser; the tickets page reads it when the address doesn't name a view. */
function remember(view: TicketView) {
  document.cookie = `${TICKETS_VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
}

/** List or Board. The choice is remembered, so Tickets opens the same way next time. Phones show the icons only. */
export function ViewSwitch({ view, hrefs }: { view: TicketView; hrefs: Record<TicketView, string> }) {
  return (
    <div
      role="group"
      aria-label="Show tickets as"
      className="flex shrink-0 gap-0.5 rounded-[0.625rem] border border-line bg-card p-0.5 max-md:h-11 max-md:rounded-full max-md:border-transparent max-md:p-1 max-md:shadow-[0_0.0625rem_0.125rem_rgba(20,22,40,0.06),0_0.125rem_0.5rem_rgba(20,22,40,0.04)]"
    >
      {VIEWS.map(({ value, label, icon: Icon }) => (
        <Link
          key={value}
          href={hrefs[value]}
          onClick={() => remember(value)}
          aria-current={view === value ? "page" : undefined}
          title={`Show as a ${label.toLowerCase()}`}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8438rem] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-acc/30 max-md:size-9 max-md:justify-center max-md:rounded-full max-md:px-0",
            view === value ? "bg-acc-t text-acc-ink" : "text-ink2 hover:bg-surface2 hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="max-md:sr-only">{label}</span>
        </Link>
      ))}
    </div>
  );
}
