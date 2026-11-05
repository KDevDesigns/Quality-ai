"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { BellIcon, CheckCheckIcon, InboxIcon } from "lucide-react";
import { markAllTicketsRead } from "@/app/(main)/tickets/actions";
import { UnreadDot } from "@/app/(main)/tickets/ticket-bits";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { showBadge } from "@/lib/pwa";
import { cn } from "@/lib/utils";

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

const item =
  "flex cursor-default items-start gap-2.5 rounded-md px-3 py-2.5 text-[0.9063rem] outline-hidden select-none data-highlighted:bg-acc-t2 data-highlighted:text-acc-ink";

/** The topbar bell: how many tickets are unread, and the newest ones. Same menu as the account menu beside it. */
export function NotificationBell() {
  const { data, poll } = useNotifications();
  const [marking, startTransition] = useTransition();
  const router = useRouter();
  const count = data?.count ?? 0;
  const now = new Date();

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={count ? `Notifications: ${count} unread ticket${count === 1 ? "" : "s"}` : "Notifications"}
            title="Notifications"
            className="relative size-[2.375rem] rounded-[0.5625rem] text-ink2 data-popup-open:bg-acc-t2"
          />
        }
      >
        <BellIcon />
        {count ? (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-bad px-1 text-[0.6875rem] leading-none font-semibold text-on-tone ring-2 ring-background"
            aria-hidden
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="isolate z-50">
          <Menu.Popup className="w-[22rem] max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-150 ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-2.5">
              <span className="text-[0.9063rem] font-semibold">Notifications</span>
              {count ? <span className="text-[0.7813rem] text-muted-foreground">{count} unread</span> : null}
            </div>
            <Menu.Separator className="-mx-1.5 my-1 h-px bg-line2" />
            {data?.items.length ? (
              data.items.map((t) => (
                <Menu.Item key={t.id} className={item} render={<Link href={`/tickets/${t.number}?tab=conversation`} />}>
                  <UnreadDot className="mt-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      <span className="font-mono text-[0.7813rem] text-muted-foreground">#{t.number}</span> {t.title}
                    </span>
                    <span className="block text-[0.7813rem] text-muted-foreground">
                      {t.actorName ? `${t.actorName} · ` : ""}
                      {timeAgo(new Date(t.lastActivityAt), now)}
                    </span>
                  </span>
                </Menu.Item>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
            <Menu.Separator className="-mx-1.5 my-1 h-px bg-line2" />
            <Menu.Item className={cn(item, "h-10 items-center py-0 [&_svg]:size-4 [&_svg]:text-ink2 data-highlighted:[&_svg]:text-primary-text")} render={<Link href="/inbox" />}>
              <InboxIcon /> My inbox
            </Menu.Item>
            {count ? (
              <>
                <Menu.Item
                  className={cn(item, "h-10 items-center py-0 [&_svg]:size-4 [&_svg]:text-ink2 data-highlighted:[&_svg]:text-primary-text")}
                  disabled={marking}
                  onClick={() =>
                    startTransition(async () => {
                      await markAllTicketsRead();
                      poll();
                      router.refresh();
                    })
                  }
                >
                  <CheckCheckIcon /> {marking ? "Marking…" : "Mark all as read"}
                </Menu.Item>
              </>
            ) : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

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
