"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { swipeStep } from "@/lib/tickets/swipe";
import { cn } from "@/lib/utils";

// Phones: the ticket as two tabs, Details & logs and Conversation, by tapping or swiping. Laptops show every part
// at once, so there the tabs are hidden and the panes leave no box of their own. Both tabs stay mounted, so a half-written
// reply survives switching. The tab is in the URL (?tab=conversation), replaced so that Back leaves the ticket.

export type TicketTab = "details" | "conversation";

const TABS: TicketTab[] = ["details", "conversation"];

const ActiveTab = createContext<TicketTab>("details");

/** Part of the ticket that belongs to one tab. */
export function TicketPane({ tab, children }: { tab: TicketTab; children: React.ReactNode }) {
  const active = useContext(ActiveTab);
  return <div className={cn("contents", active !== tab && "max-md:hidden")}>{children}</div>;
}

/** A swipe starting on these means something else: a dialog (its clicks reach here through React), or a control. */
const NOT_A_SWIPE = "[role='dialog'], video, input, textarea, select, canvas";

export function TicketTabs({ replies, children }: { replies: number; children: React.ReactNode }) {
  const params = useSearchParams();
  const mobile = useIsMobile();
  const active: TicketTab = params.get("tab") === "conversation" ? "conversation" : "details";
  const start = useRef<{ x: number; y: number } | null>(null);
  const shown = useRef<TicketTab>("details");

  // The conversation opens at its newest message, by the reply box; going back to Details starts at the top.
  useEffect(() => {
    if (!mobile || active === shown.current) return;
    shown.current = active;
    if (active === "conversation") document.getElementById("ticket-reply")?.scrollIntoView({ block: "end" });
    else window.scrollTo({ top: 0 });
  }, [active, mobile]);

  function pick(tab: TicketTab) {
    const url = new URL(window.location.href);
    if (tab === "details") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url);
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const target = e.target as Element;
    const swipe = e.touches.length === 1 && e.currentTarget.contains(target) && !target.closest(NOT_A_SWIPE);
    start.current = swipe ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!start.current) return;
    const step = swipeStep(e.changedTouches[0].clientX - start.current.x, e.changedTouches[0].clientY - start.current.y);
    start.current = null;
    const next = TABS[TABS.indexOf(active) + step];
    if (step && next) pick(next);
  }

  return (
    <ActiveTab.Provider value={active}>
      <div className="grid min-w-0 grid-cols-1 gap-6 max-md:flex max-md:flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => (start.current = null)}>
        <div role="group" aria-label="Ticket sections" className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-5 -mx-5 grid grid-cols-2 gap-2 bg-grouped/95 px-5 py-2 backdrop-blur md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={active === tab}
              onClick={() => pick(tab)}
              className={cn(
                "flex h-10 min-w-0 cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-acc/30",
                active === tab ? "border-acc bg-acc text-primary-foreground" : "border-line bg-card text-ink2",
              )}
            >
              {tab === "details" ? "Details & logs" : `Conversation${replies ? ` (${replies})` : ""}`}
            </button>
          ))}
        </div>
        {children}
      </div>
    </ActiveTab.Provider>
  );
}
