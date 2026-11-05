"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { showBadge } from "@/lib/pwa";

// Unread tickets for the bell, the sidebar counts and the red dots, from GET /api/notifications. Polled at once when a
// device notification arrives (app/(main)/tone-listener.tsx), every 30 seconds while the tab is visible, and when the
// tab or window comes back, so new tickets and replies show up without a reload. Nothing is polled on a hidden tab.

const POLL_MS = 30_000;

type Item = { id: string; number: number; title: string; status: string; lastActivityAt: string; actorName: string | null };
/** count/items: everything unread (the bell). messages: unread replies (My inbox). newTickets: unopened tickets (Tickets). */
type Data = { count: number; items: Item[]; messages: number; newTickets: number; requests: number };
type Ctx = { data: Data | null; poll: () => void };

const NotificationsContext = createContext<Ctx>({ data: null, poll: () => {} });

const noChange = () => () => {};

/**
 * The first answer can arrive before a part of the page further down has hydrated. Counts stay empty until it has, as in
 * the server's HTML, or React throws that part away and rebuilds it.
 */
export const useNotifications = (): Ctx => {
  const ctx = useContext(NotificationsContext);
  const hydrated = useSyncExternalStore(noChange, () => true, () => false);
  return hydrated ? ctx : { ...ctx, data: null };
};

/** Pages that list or show tickets, refreshed in place when something new arrives. */
const LIVE = (path: string) => path === "/" || path === "/inbox" || path === "/tickets" || path.startsWith("/tickets/");

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const router = useRouter();
  const last = useRef<Data | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok || !res.headers.get("content-type")?.includes("json")) return;
      const next = (await res.json()) as Data;
      const prev = last.current;
      last.current = next;
      setData(next);
      showBadge(next.count);
      // Refresh only for something new, not when reading a ticket lowered the count.
      const newer = prev && (next.count > prev.count || (next.items[0]?.lastActivityAt ?? "") > (prev.items[0]?.lastActivityAt ?? ""));
      // The address is read here, not with usePathname: this provider is part of the prerendered shell.
      if (newer && LIVE(window.location.pathname)) router.refresh();
    } catch {
      // Offline or a deploy in progress: try again on the next tick.
    }
  }, [router]);

  useEffect(() => {
    // Deferred, not called in the effect body: the first result arrives as a callback like every later one.
    const first = setTimeout(poll, 0);
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    // A window behind another one stays "visible", so coming back to it only shows as focus.
    window.addEventListener("focus", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [poll]);

  return <NotificationsContext.Provider value={{ data, poll }}>{children}</NotificationsContext.Provider>;
}

// The bell and the notifications panel are in components/notifications-panel.tsx.

/** A red dot and a number for a sidebar entry, e.g. "● 3". Nothing at 0. */
export function NavCount({ count, label }: { count: number; label: string }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-bad-t px-1.5 py-0.5 text-[0.75rem] leading-none font-semibold text-bad">
      <span className="size-1.5 rounded-full bg-bad" aria-hidden />
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
