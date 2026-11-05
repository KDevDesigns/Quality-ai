"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef } from "react";
import { StatusPill } from "@/components/status-pill";
import { useIsMobile } from "@/hooks/use-mobile";
import { swipeStep } from "@/lib/tickets/swipe";
import { cn } from "@/lib/utils";

// The ticket as two tabs, Details and Conversation. Both stay mounted, so a half-written reply survives switching. The tab is
// in the URL (?tab=conversation), replaced so that Back leaves the ticket. Laptops: underline tabs below the ticket's title,
// steps and next move, which stay in view on both tabs. Phones: a sticky control at the top, also by swiping, and those parts
// belong to Details.

export type TicketTab = "details" | "conversation";

const TABS: TicketTab[] = ["details", "conversation"];

const ActiveTab = createContext<TicketTab>("details");

/** Part of the ticket that belongs to one tab. */
export function TicketPane({ tab, children }: { tab: TicketTab; children: React.ReactNode }) {
  const active = useContext(ActiveTab);
  return <div className={cn("contents", active !== tab && "hidden")}>{children}</div>;
}

/** The ticket's title, steps and next move: Details only on a phone, always on a laptop. */
function TicketHeader({ active, children }: { active: TicketTab; children: React.ReactNode }) {
  // Big screens (D21): one block of natural height, so the tab panel below gets the rest of the window.
  return <div className={cn("contents desk:flex desk:shrink-0 desk:flex-col desk:gap-5", active !== "details" && "max-md:hidden")}>{children}</div>;
}

/** A swipe starting on these means something else: a dialog (its clicks reach here through React), or a control. */
const NOT_A_SWIPE = "[role='dialog'], [data-no-swipe], video, input, textarea, select, canvas";

const tabId = (tab: TicketTab) => `ticket-tab-${tab}`;

export function TicketTabs({ replies, header, children }: { replies: number; header: React.ReactNode; children: React.ReactNode }) {
  const params = useSearchParams();
  const mobile = useIsMobile();
  const active: TicketTab = params.get("tab") === "conversation" ? "conversation" : "details";
  const start = useRef<{ x: number; y: number } | null>(null);
  const shown = useRef({ tab: "details" as TicketTab, mobile: false });
  const list = useRef<HTMLDivElement>(null);

  // The conversation opens at its newest message, by the reply box; on a phone, going back to Details starts at the top.
  // `mobile` is false until hydrated, so a phone opening ?tab=conversation directly comes through here a second time.
  useEffect(() => {
    const before = shown.current;
    if (active === before.tab && mobile === before.mobile) return;
    shown.current = { tab: active, mobile };
    if (active === "conversation") {
      const thread = document.getElementById("ticket-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
      if (mobile) document.getElementById("ticket-reply")?.scrollIntoView({ block: "end" });
    } else if (mobile && before.tab === "conversation") window.scrollTo({ top: 0 });
  }, [active, mobile]);

  function pick(tab: TicketTab) {
    const url = new URL(window.location.href);
    if (tab === "details") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = TABS.indexOf(active);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const tab = TABS[(next + TABS.length) % TABS.length];
    pick(tab);
    list.current?.querySelector<HTMLButtonElement>(`#${tabId(tab)}`)?.focus();
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
      {/* Big screens (D21): the ticket fits the window, the same height budget as New ticket; only the cards scroll. */}
      <div className="grid min-w-0 grid-cols-1 gap-5 max-md:flex max-md:flex-col desk:flex desk:h-[calc(100dvh-12.5rem)] desk:min-h-112 desk:flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => (start.current = null)}>
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
        <TicketHeader active={active}>{header}</TicketHeader>
        <div ref={list} role="tablist" aria-label="Ticket sections" onKeyDown={onKeyDown} className="flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-line max-md:hidden">
          {TABS.map((tab) => {
            const on = active === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={tabId(tab)}
                aria-selected={on}
                aria-controls="ticket-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => pick(tab)}
                className={cn(
                  "inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 text-[0.9375rem] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  on ? "border-acc text-primary-text" : "border-transparent text-muted-foreground hover:bg-row-hover hover:text-foreground",
                )}
              >
                {tab === "details" ? "Details" : "Conversation"}
                {tab === "conversation" && replies ? (
                  <StatusPill tone="acc">
                    {replies}
                    <span className="sr-only"> {replies === 1 ? "reply" : "replies"}</span>
                  </StatusPill>
                ) : null}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id="ticket-panel" aria-labelledby={tabId(active)} className="min-w-0 desk:min-h-0 desk:flex-1">
          {children}
        </div>
      </div>
    </ActiveTab.Provider>
  );
}
