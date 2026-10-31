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
import { cn } from "@/lib/utils";
import { isActive, navGroups } from "./nav";
import { NavCount, useNotifications } from "./notifications";

export type SidebarUser = { name: string; role: Role };

// Brand and 40px menu items follow the DCWD Careers (ERP HRMS) sidebar. The signed-in person is in the topbar (user-menu.tsx).
// Minimised (the topbar's toggle or Ctrl+B), it springs down to a rail of icons: the brand text and the labels fade and
// slide away one after another, the seal turns, counts become dots, and each icon gets its name as a tooltip.

/** Seen from inside the sidebar: it is minimised to icons. */
const rail = "group-data-[collapsible=icon]";

const navButton = cn(
  "h-10 gap-3.5 rounded-lg px-3.5 text-[15px] font-medium text-sidebar-foreground transition-[background-color,transform,box-shadow,width,height,padding] duration-200 hover:translate-x-[3px] hover:bg-acc-t2 data-active:translate-x-0 data-active:bg-acc data-active:font-medium data-active:text-primary-foreground data-active:shadow-[0_4px_14px_color-mix(in_srgb,var(--acc)_32%,transparent)] data-active:hover:bg-acc data-active:hover:text-primary-foreground [&_svg]:size-[18px]",
  `${rail}:size-10! ${rail}:p-[11px]! ${rail}:hover:translate-x-0 ${rail}:hover:scale-110 ${rail}:active:scale-95`,
  "[&_svg]:transition-transform [&_svg]:duration-(--sidebar-dur) [&_svg]:ease-(--sidebar-ease)",
);
const groupLabel = cn(
  "h-auto px-[9px] pt-5 pb-2.5 text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase duration-300 ease-(--ease-out)",
  `${rail}:-translate-x-3`,
);
/** Text that fades and slides out when minimised, and back in (a beat later) when opened. */
const fadeText = cn(
  "transition-[opacity,transform] duration-300 ease-(--ease-out) delay-(--d)",
  `${rail}:-translate-x-3 ${rail}:opacity-0 ${rail}:delay-0`,
);

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
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn("h-[72px] flex-row items-center gap-3 border-b border-line2 px-4 py-0 transition-[padding] duration-(--sidebar-dur) ease-(--sidebar-ease)", `${rail}:px-2`)}>
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none">
          <Image
            src="/dcwd-seal.png"
            alt="DCWD seal"
            width={40}
            height={40}
            priority
            className={cn("shrink-0 transition-transform duration-700 ease-(--sidebar-ease)", `${rail}:-rotate-[360deg]`)}
          />
          <span className={cn("flex flex-col whitespace-nowrap", fadeText)} style={{ "--d": "120ms" } as React.CSSProperties}>
            <span className="text-[22px] leading-none font-bold tracking-[-0.01em] text-acc">DCWD</span>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-acc uppercase">QA Hub</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className={cn("gap-0 px-2 transition-[padding] duration-(--sidebar-dur) ease-(--sidebar-ease)", `${rail}:px-0`)}>
        {navGroups(user?.role ?? null).map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel className={groupLabel}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map(({ href, label, icon: Icon, soon }, i) =>
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
                      <SidebarMenuButton isActive={active(href)} render={<Link href={href} />} className={navButton} tooltip={label}>
                        <Icon />
                        <span className={cn("whitespace-nowrap", fadeText)} style={{ "--d": `${60 + i * 35}ms` } as React.CSSProperties}>
                          {label}
                        </span>
                      </SidebarMenuButton>
                      {counts[href]?.count ? (
                        <>
                          <SidebarMenuBadge className="right-2 h-auto px-0 peer-data-[size=default]/menu-button:top-1/2 -translate-y-1/2">
                            <NavCount {...counts[href]} />
                          </SidebarMenuBadge>
                          {/* Minimised, the count becomes a dot on the icon. */}
                          <span className={cn("pointer-events-none absolute top-1 left-7 pop-in hidden size-2.5 rounded-full border-2 border-sidebar bg-bad", `${rail}:block`)} aria-hidden />
                        </>
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
