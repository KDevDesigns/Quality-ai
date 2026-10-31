"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/auth/permissions";
import { isActive, navGroups } from "./nav";
import { NavCount, useNotifications } from "./notifications";

export type SidebarUser = { name: string; role: Role };

// Brand and 40px menu items follow the DCWD Careers (ERP HRMS) sidebar. The signed-in person is in the topbar (user-menu.tsx).

const navButton =
  "h-10 gap-3.5 rounded-lg px-3.5 text-[15px] font-medium text-sidebar-foreground transition-[background-color,transform,box-shadow] duration-200 hover:translate-x-[3px] hover:bg-acc-t2 data-active:translate-x-0 data-active:bg-acc data-active:font-medium data-active:text-primary-foreground data-active:shadow-[0_4px_14px_color-mix(in_srgb,var(--acc)_32%,transparent)] data-active:hover:bg-acc data-active:hover:text-primary-foreground [&_svg]:size-[18px]";
const groupLabel = "h-auto px-[9px] pt-5 pb-2.5 text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase";

export function AppSidebar({ user }: { user: SidebarUser | null }) {
  return <SidebarView pathname={usePathname()} user={user} />;
}

/**
 * The layout's Suspense fallback. It is part of the prerendered shell, where the path of a route like /tickets/[number]
 * isn't known yet, so it must not read it (the build fails if it does).
 */
export function AppSidebarShell() {
  return <SidebarView pathname={null} user={null} />;
}

function SidebarView({ pathname, user }: { pathname: string | null; user: SidebarUser | null }) {
  const active = (href: string) => pathname !== null && isActive(pathname, href);
  const { data } = useNotifications();
  // Unread replies on My inbox, unopened new tickets on Tickets, and sign-up and password requests on Users.
  const counts: Record<string, { count: number; label: string }> = {
    "/inbox": { count: data?.messages ?? 0, label: "unread messages" },
    "/tickets": { count: data?.newTickets ?? 0, label: "new tickets" },
    "/admin/users": { count: data?.requests ?? 0, label: "waiting" },
  };
  return (
    <Sidebar>
      <SidebarHeader className="h-[72px] flex-row items-center gap-3 border-b border-line2 px-4 py-0">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none">
          <Image src="/dcwd-seal.png" alt="DCWD seal" width={40} height={40} priority />
          <span className="flex flex-col">
            <span className="text-[22px] leading-none font-bold tracking-[-0.01em] text-acc">DCWD</span>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-acc uppercase">QA Hub</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2">
        {navGroups(user?.role ?? null).map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel className={groupLabel}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map(({ href, label, icon: Icon, soon }) =>
                  soon ? (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton disabled aria-disabled className="h-9 gap-3.5 rounded-lg px-3.5 text-sm [&_svg]:size-4">
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="rounded-md bg-surface3 font-mono text-[11px] font-semibold text-muted-foreground">{soon}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton isActive={active(href)} render={<Link href={href} />} className={navButton}>
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                      {counts[href]?.count ? (
                        <SidebarMenuBadge className="right-2 h-auto px-0 peer-data-[size=default]/menu-button:top-1/2 -translate-y-1/2">
                          <NavCount {...counts[href]} />
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
