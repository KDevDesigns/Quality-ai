"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// My account as sections: underline tabs along the top, one section at a time (Account.dc.html). The chosen tab is in
// the URL (?tab=sound), so links, refresh and Back keep it. ?tab=password, still linked from Settings, opens Profile at
// its password fields. Phones have no tabs here: the Settings tab lists the sections and opens one.

export type AccountTab = { id: string; label: string; content: React.ReactNode };

/** Old section names that now live inside another tab, and the part of it to scroll to. */
const ALIASES: Record<string, { tab: string; anchor: string }> = { password: { tab: "profile", anchor: "change-password" } };

export function AccountTabs({ tabs, initial }: { tabs: AccountTab[]; initial: string }) {
  const params = useSearchParams();
  const asked = params.get("tab") ?? "";
  const alias = ALIASES[asked];
  const current = tabs.find((t) => t.id === (alias?.tab ?? asked))?.id ?? initial;
  const list = useRef<HTMLDivElement>(null);

  // Settings → Password: open Profile and bring the password fields into view.
  useEffect(() => {
    if (alias) document.getElementById(alias.anchor)?.scrollIntoView({ block: "start" });
  }, [alias]);

  function pick(id: string, focus = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.pushState(null, "", url);
    if (focus) list.current?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === current);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(tabs[(next + tabs.length) % tabs.length].id, true);
  }

  const active = tabs.find((t) => t.id === current)!;
  return (
    <div className="grid gap-5">
      <div ref={list} role="tablist" aria-label="Account sections" onKeyDown={onKeyDown} className="hidden gap-1 overflow-x-auto overflow-y-hidden border-b border-line md:flex">
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
                "inline-flex h-12 shrink-0 cursor-pointer items-center border-b-2 px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                on ? "border-acc text-primary-text" : "border-transparent text-muted-foreground hover:bg-row-hover hover:text-foreground",
              )}
            >
              {t.label}
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
