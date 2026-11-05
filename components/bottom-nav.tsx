"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/auth/permissions";
import { useKeyboardOpen } from "@/hooks/use-keyboard-open";
import { cn } from "@/lib/utils";
import { isTabRoot, mobileTabFor, mobileTabs } from "./nav";
import { useNotifications } from "./notifications";

// Phones only (below md): the tab bar at the bottom of the screen, in place of the sidebar. It shows on each tab's own
// page; inside one (a ticket, an open conversation) the top bar's back arrow takes over and the page gets the bottom
// for its reply box or main button. It slides away while the keyboard is open.

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const keyboard = useKeyboardOpen();
  const { data } = useNotifications();
  if (!isTabRoot(pathname, params.has("t"))) return null;

  const tabs = mobileTabs(role);
  const lit = mobileTabFor(pathname);
  const counts: Record<string, number | undefined> = { "/tickets": data?.newTickets, "/inbox": data?.messages, "/settings": data?.requests };

  return (
    <nav
      aria-label="Main"
      data-bottom-nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line2 bg-card/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 transition-transform duration-200 ease-(--ease-out) md:hidden",
        keyboard && "translate-y-full",
      )}
    >
      <ul className={cn("mx-auto grid h-16 max-w-lg", tabs.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {tabs.map((t) => {
          const on = t.href === lit;
          const count = counts[t.href] ?? 0;
          const Icon = t.icon;
          const badge = count ? (
            <span
              className={cn(
                "absolute flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-bad px-1 text-[0.6875rem] leading-none font-bold text-on-tone ring-2 ring-card",
                t.main ? "-top-1.5 -right-2" : "-top-1.5 left-[calc(100%-0.5rem)]",
              )}
              aria-hidden
            >
              {count > 99 ? "99+" : count}
            </span>
          ) : null;
          return (
            <li key={t.href} className="flex">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[0.6875rem] leading-none outline-none focus-visible:ring-2 focus-visible:ring-acc/40 active:opacity-70",
                  on ? "font-semibold text-acc-ink" : "font-medium text-muted-foreground",
                )}
              >
                {t.main ? (
                  // The main tab: a raised rounded square in the accent colour, ringed in the page colour.
                  <span className="relative -mt-7 flex size-[3.375rem] items-center justify-center rounded-[1.125rem] bg-acc text-primary-foreground shadow-[0_0.5rem_1.125rem_color-mix(in_srgb,var(--acc)_40%,transparent)] ring-[0.3125rem] ring-grouped">
                    <Icon className="size-[1.625rem]" aria-hidden />
                    {badge}
                  </span>
                ) : (
                  <span className="relative">
                    <Icon className="size-6" strokeWidth={on ? 2.2 : 1.8} aria-hidden />
                    {badge}
                  </span>
                )}
                <span>
                  {t.label}
                  {count ? <span className="sr-only">, {count} new</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
