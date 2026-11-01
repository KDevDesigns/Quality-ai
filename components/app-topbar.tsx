"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SidebarUser } from "./app-sidebar";
import { backTarget, currentNav, isActive, isTabRoot, mobileTitle } from "./nav";
import { NotificationBell } from "./notifications";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const GROUP_LABEL = { tickets: "Tickets", admin: "Admin" } as const;

/** Pages seen in this tab since QA Hub loaded. More than one means Back can return inside QA Hub. */
let pagesSeen = 0;

type PhoneNav = { back: { href: string; label: string }; title: string };

export function AppTopbar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    pagesSeen++;
  }, [pathname]);
  const phone = isTabRoot(pathname, params.has("t")) ? null : { back: backTarget(pathname), title: mobileTitle(pathname, params) };
  return <TopbarView pathname={pathname} user={user} phone={phone} />;
}

/** The layout's Suspense fallback; like AppSidebarShell, it must not read the path while the shell is prerendered. */
export function AppTopbarShell() {
  return <TopbarView pathname={null} user={null} phone={null} />;
}

/**
 * Laptops: breadcrumb, bell, theme and account menu. Phones: a tab's own page has no top bar (the page's large title
 * and the bottom tab bar do the job); an inner page gets a slim bar with "‹ Tickets" and a short title.
 */
function TopbarView({ pathname, user, phone }: { pathname: string | null; user: SidebarUser | null; phone: PhoneNav | null }) {
  const { item, group } = pathname === null ? { item: null, group: null } : currentNav(pathname);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-line2 bg-background/95 px-4 backdrop-blur max-md:hidden md:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="size-[2.375rem] rounded-[0.5625rem] border border-line text-ink2" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            {group ? (
              <>
                <span>{GROUP_LABEL[group]}</span>
                <span aria-hidden>/</span>
              </>
            ) : null}
            {item ? <b className="truncate font-semibold text-foreground" aria-current="page">{item.label}</b> : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? <NotificationBell /> : null}
          <ThemeToggle />
          {user ? <UserMenu user={user} active={pathname !== null && isActive(pathname, "/account")} /> : null}
        </div>
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
function BackButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (pagesSeen > 1) {
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
