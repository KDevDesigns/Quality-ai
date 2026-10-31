"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// My account as sections: a list of tabs on the left (a scrolling row on phones) and one section at a time. The chosen
// tab is in the URL (?tab=sound), so links, refresh and Back keep it.

export type AccountTab = { id: string; label: string; hint: string; icon: React.ReactNode; content: React.ReactNode };

export function AccountTabs({ tabs, initial }: { tabs: AccountTab[]; initial: string }) {
  const params = useSearchParams();
  const current = tabs.find((t) => t.id === params.get("tab"))?.id ?? initial;
  const list = useRef<HTMLDivElement>(null);

  function pick(id: string, focus = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.pushState(null, "", url);
    if (focus) list.current?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === current);
    const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(tabs[(next + tabs.length) % tabs.length].id, true);
  }

  const active = tabs.find((t) => t.id === current)!;
  return (
    <div className="grid gap-5 md:grid-cols-[230px_minmax(0,1fr)] md:items-start md:gap-8">
      <div
        ref={list}
        role="tablist"
        aria-label="Account settings"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:sticky md:top-20 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0"
      >
        {tabs.map((t) => {
          const on = t.id === current;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              data-tab={t.id}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => pick(t.id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-left text-[14.5px] font-medium whitespace-nowrap transition-[background-color,color,transform] duration-200 ease-(--ease-out) outline-none focus-visible:ring-3 focus-visible:ring-acc/25 active:scale-[0.98] [&_svg]:size-[18px] [&_svg]:shrink-0",
                on ? "bg-acc text-primary-foreground shadow-[0_4px_14px_color-mix(in_srgb,var(--acc)_30%,transparent)]" : "text-ink2 hover:bg-acc-t2 hover:text-foreground md:hover:translate-x-[3px]",
              )}
            >
              {t.icon}
              <span className="grid">
                {t.label}
                <span className={cn("hidden text-[12px] font-normal md:block", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div key={active.id} role="tabpanel" id={`panel-${active.id}`} aria-labelledby={`tab-${active.id}`} className="panel-in grid min-w-0 gap-5">
        {active.content}
      </div>
    </div>
  );
}
