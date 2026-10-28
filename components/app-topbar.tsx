"use client";

import { usePathname } from "next/navigation";
import { LogOutIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/app/login/actions";
import type { SidebarUser } from "./app-sidebar";
import { currentNav } from "./nav";

const GROUP_LABEL = { tickets: "Tickets", admin: "Admin", ai: "AI workbench" } as const;

export function AppTopbar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const { item, group } = currentNav(pathname);

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
          <b className="truncate font-semibold text-foreground" aria-current="page">{item.label}</b>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {group === "ai" ? (
          <span className="hidden h-[30px] items-center gap-1.5 rounded-full border border-ok-b bg-ok-t px-3 text-[13px] font-semibold whitespace-nowrap text-ok md:inline-flex">
            <ShieldCheckIcon className="size-3.5" aria-hidden />
            Staging only · never production
          </span>
        ) : null}
        {user ? (
          <form action={logout}>
            <Button type="submit" variant="outline" className="h-[38px] rounded-[9px] px-3.5">
              <LogOutIcon /> Sign out
            </Button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
