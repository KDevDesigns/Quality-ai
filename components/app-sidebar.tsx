"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConicalIcon, ShieldCheckIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isActive, LATER_NAV, MAIN_NAV } from "./nav";

const navButton =
  "h-11 gap-3.5 rounded-lg px-3.5 text-[15px] font-medium text-sidebar-foreground transition-[background-color,transform,box-shadow] duration-200 hover:translate-x-[3px] hover:bg-acc-t2 data-active:translate-x-0 data-active:bg-acc data-active:font-medium data-active:text-white data-active:shadow-[0_4px_14px_rgba(79,86,211,0.32)] data-active:hover:bg-acc data-active:hover:text-white [&_svg]:size-[18px]";
const groupLabel = "h-auto px-[9px] pt-5 pb-2.5 text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase";

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader className="h-[72px] flex-row items-center gap-3 border-b border-line2 px-4 py-0">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-acc text-white" aria-hidden>
            <FlaskConicalIcon className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-[24px] leading-none font-bold tracking-[-0.01em] text-brand">QA AI</span>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">ERP Workbench</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {MAIN_NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton isActive={isActive(pathname, href)} render={<Link href={href} />} className={navButton}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>Coming in later phases</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {LATER_NAV.map(({ label, icon: Icon, phase }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton disabled aria-disabled className="h-9 gap-3.5 rounded-lg px-3.5 text-sm [&_svg]:size-4">
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="rounded-md bg-surface3 font-mono text-[11px] font-semibold text-muted-foreground">P{phase}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-line2 p-4">
        <div className="flex items-center gap-3 text-[13px] text-ink2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-ok-t text-ok" aria-hidden>
            <ShieldCheckIcon className="size-[18px]" />
          </span>
          <span className="leading-snug">
            <span className="block font-semibold text-foreground">Production blocked</span>
            Every URL is checked against an allowlist.
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
