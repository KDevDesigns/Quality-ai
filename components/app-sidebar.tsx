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

const navButton = cn(
  "h-10 gap-3.5 rounded-lg px-3.5 text-[0.9375rem] font-medium text-sidebar-foreground transition-[background-color,transform,box-shadow,width,height,padding] duration-200 hover:translate-x-[0.1875rem] hover:bg-acc-t2 data-active:translate-x-0 data-active:bg-acc data-active:font-medium data-active:text-primary-foreground data-active:shadow-[0_0.25rem_0.875rem_color-mix(in_srgb,var(--acc)_32%,transparent)] data-active:hover:bg-acc data-active:hover:text-primary-foreground [&_svg]:size-[1.125rem]",
  // In the rail: exactly 40 px with the icon centred, and only the icon grows on hover, so nothing is clipped.
  "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-[0.6875rem]! group-data-[collapsible=icon]:hover:translate-x-0 group-data-[collapsible=icon]:hover:[&_svg]:scale-115 group-data-[collapsible=icon]:active:[&_svg]:scale-95",
  "[&_svg]:transition-transform [&_svg]:duration-(--sidebar-dur) [&_svg]:ease-(--sidebar-ease)",
);
const groupLabel = cn(
  "h-auto px-[0.5625rem] pt-5 pb-2.5 text-[0.6875rem] font-normal tracking-[0.12em] text-muted-foreground uppercase duration-300 ease-(--ease-out)",
  "group-data-[collapsible=icon]:-translate-x-3",
);
/** Text that fades and slides out when minimised, and back in (a beat later) when opened. */
const fadeText = cn(
  "transition-[opacity,transform] duration-300 ease-(--ease-out) delay-(--d)",
  "group-data-[collapsible=icon]:-translate-x-3 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0",
);
/** The brand text also gives up its width in the rail, so it never spills past the edge while the sidebar shrinks. */
const brandText = cn(fadeText, "max-w-40 overflow-hidden transition-[opacity,transform,max-width]", "group-data-[collapsible=icon]:max-w-0");

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
      <SidebarHeader
        className={cn("h-[4.5rem] flex-row items-center gap-3 overflow-hidden border-b border-line2 px-4 py-0 transition-[padding] duration-(--sidebar-dur) ease-(--sidebar-ease)", "group-data-[collapsible=icon]:px-2")}
      >
        <Link
          href="/"
          className={cn("flex items-center gap-3 rounded-lg transition-[gap] duration-(--sidebar-dur) ease-(--sidebar-ease) focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none", "group-data-[collapsible=icon]:gap-0")}
        >
          <Image
            src="/dcwd-seal.png"
            alt="DCWD seal"
            width={40}
            height={40}
            priority
            className="shrink-0"
          />
          <span className={cn("flex flex-col whitespace-nowrap", brandText)} style={{ "--d": "120ms" } as React.CSSProperties}>
            <span className="text-[1.375rem] leading-none font-bold tracking-[-0.01em] text-acc">DCWD</span>
            <span className="mt-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-acc uppercase">QA Hub</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className={cn("gap-0 px-2 transition-[padding] duration-(--sidebar-dur) ease-(--sidebar-ease)", "group-data-[collapsible=icon]:px-0")}>
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
                      <SidebarMenuBadge className="rounded-md bg-surface3 font-mono text-[0.6875rem] font-semibold text-muted-foreground">{soon}</SidebarMenuBadge>
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
                          <span className={cn("pointer-events-none absolute top-[0.4375rem] left-[1.5625rem] pop-in hidden size-2.5 rounded-full border-2 border-sidebar bg-bad", "group-data-[collapsible=icon]:block")} aria-hidden />
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
