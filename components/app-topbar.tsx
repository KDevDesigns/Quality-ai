"use client";

import { usePathname } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SidebarUser } from "./app-sidebar";
import { currentNav, isActive } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const GROUP_LABEL = { tickets: "Tickets", admin: "Admin", ai: "AI workbench" } as const;

export function AppTopbar({ user }: { user: SidebarUser | null }) {
  return <TopbarView pathname={usePathname()} user={user} />;
}

/** The layout's Suspense fallback; like AppSidebarShell, it must not read the path while the shell is prerendered. */
export function AppTopbarShell() {
  return <TopbarView pathname={null} user={null} />;
}

function TopbarView({ pathname, user }: { pathname: string | null; user: SidebarUser | null }) {
  const { item, group } = pathname === null ? { item: null, group: null } : currentNav(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-line2 bg-background/95 px-4 backdrop-blur md:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-[38px] rounded-[9px] border border-line text-ink2" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {group ? (
            <>
              <span className="hidden sm:inline">{GROUP_LABEL[group]}</span>
              <span className="hidden sm:inline" aria-hidden>/</span>
            </>
          ) : null}
          {item ? <b className="truncate font-semibold text-foreground" aria-current="page">{item.label}</b> : null}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {group === "ai" ? (
          <span className="hidden h-[30px] items-center gap-1.5 rounded-full border border-ok-b bg-ok-t px-3 text-[13px] font-semibold whitespace-nowrap text-ok md:inline-flex">
            <ShieldCheckIcon className="size-3.5" aria-hidden />
            Staging only · never production
          </span>
        ) : null}
        <ThemeToggle />
        {user ? <UserMenu user={user} active={pathname !== null && isActive(pathname, "/account")} /> : null}
      </div>
    </header>
  );
}
