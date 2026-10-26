"use client";

import { usePathname } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isActive, MAIN_NAV } from "./nav";

export function AppTopbar() {
  const pathname = usePathname();
  const current = MAIN_NAV.find((n) => n.href !== "/" && isActive(pathname, n.href)) ?? MAIN_NAV[0];

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-line2 bg-background/95 px-4 backdrop-blur md:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-[38px] rounded-[9px] border border-line text-ink2" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Workbench</span>
          <span className="hidden sm:inline" aria-hidden>/</span>
          <b className="truncate font-semibold text-foreground" aria-current="page">{current.label}</b>
        </nav>
      </div>
      <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-ok-b bg-ok-t px-3 text-[13px] font-semibold whitespace-nowrap text-ok">
        <ShieldCheckIcon className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Staging only · never production</span>
        <span className="sm:hidden">Staging only</span>
      </span>
    </header>
  );
}
