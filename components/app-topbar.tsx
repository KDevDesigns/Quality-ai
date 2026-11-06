"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect } from "react";
import { ChevronLeftIcon, HouseIcon } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { focusSoon, type SidebarUser } from "./app-sidebar";
import { backTarget, breadcrumbs, isTabRoot, mobileTitle } from "./nav";
import { NotificationBell } from "./notifications-panel";
import { ThemeToggle } from "./theme-toggle";

/** Pages seen in this tab since QA Hub loaded. More than one means Back can return inside QA Hub. */
let pagesSeen = 0;

/** `up`: Back always goes to the parent page, not through the history. */
type PhoneNav = { back: { href: string; label: string; up?: boolean }; title: string };

export function AppTopbar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    pagesSeen++;
  }, [pathname]);
  // Just filed (?filing=, see tickets/actions.ts): the page before this is the finished form, so Back goes to the list.
  const back = params.has("filing") ? { href: "/tickets", label: "Tickets", up: true } : backTarget(pathname);
  const phone = isTabRoot(pathname, params.has("t")) ? null : { back, title: mobileTitle(pathname, params) };
  return <TopbarView pathname={pathname} user={user} phone={phone} />;
}

/** The layout's Suspense fallback; like AppSidebarShell, it must not read the path while the shell is prerendered. */
export function AppTopbarShell() {
  return <TopbarView pathname={null} user={null} phone={null} />;
}

/**
 * Laptops: minimize button, breadcrumb, the light/dark toggle and the bell. The person's profile is at the bottom of the sidebar. Phones: a tab's own
 * page has no top bar (the page's large title and the bottom tab bar do the job); an inner page gets a slim bar with
 * "‹ Tickets" and a short title.
 */
function TopbarView({ pathname, user, phone }: { pathname: string | null; user: SidebarUser | null; phone: PhoneNav | null }) {
  const { state } = useSidebar();
  const crumbs = pathname === null ? [] : breadcrumbs(pathname);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-24 shrink-0 items-center justify-between gap-3 border-b border-line bg-background px-6 max-md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {/* Minimised, the expand button under the seal takes over. */}
          <Tooltip>
            <TooltipTrigger
              render={
                <SidebarTrigger
                  id="sidebar-minimize"
                  variant="outline"
                  size="icon"
                  aria-label="Minimize sidebar"
                  onClick={() => focusSoon("sidebar-expand")}
                  className={cn("text-ink2 aria-expanded:bg-card hover:aria-expanded:bg-row-hover", state === "collapsed" && "hidden")}
                />
              }
            />
            <TooltipContent side="bottom">Minimize sidebar</TooltipContent>
          </Tooltip>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" aria-label="Home" className="flex size-8 items-center justify-center rounded-lg bg-acc-t text-primary-text outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <HouseIcon className="size-4" aria-hidden />
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <Fragment key={c.label}>
                  <li aria-hidden className="text-(--placeholder)">/</li>
                  {i === crumbs.length - 1 ? (
                    <li aria-current="page" className={cn("min-w-0 truncate font-semibold text-foreground", c.mono && "font-mono tabular-nums")}>{c.label}</li>
                  ) : c.href ? (
                    <li><Link href={c.href} className="text-body2 hover:text-primary-text hover:underline">{c.label}</Link></li>
                  ) : (
                    <li>{c.label}</li>
                  )}
                </Fragment>
              ))}
            </ol>
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <NotificationBell />
          </div>
        ) : null}
      </header>
      {phone ? (
        <header className="sticky top-0 z-10 grid h-[calc(3.25rem+env(safe-area-inset-top))] shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-grouped/85 px-1.5 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <BackButton {...phone.back} />
          <h1 className="max-w-[50vw] truncate text-[1.0625rem] font-semibold">{phone.title}</h1>
          <span />
        </header>
      ) : null}
    </>
  );
}

/** Back inside QA Hub when there's somewhere to go back to, otherwise up to the parent page. */
function BackButton({ href, label, up }: { href: string; label: string; up?: boolean }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!up && pagesSeen > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="flex h-11 w-fit min-w-11 items-center gap-0.5 rounded-full pr-2.5 text-[1.0625rem] text-acc-ink outline-none focus-visible:ring-3 focus-visible:ring-acc/30"
    >
      <ChevronLeftIcon className="size-7" strokeWidth={2.25} aria-hidden />
      <span className="truncate">{label}</span>
      <span className="sr-only"> (back)</span>
    </Link>
  );
}
