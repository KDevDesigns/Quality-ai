"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockIcon } from "lucide-react";
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
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { isActive, navGroups } from "./nav";

export type SidebarUser = { name: string; role: Role };

// Brand, profile block and 40px menu items follow the DCWD Careers (ERP HRMS) sidebar.

const navButton =
  "h-10 gap-3.5 rounded-lg px-3.5 text-[15px] font-medium text-sidebar-foreground transition-[background-color,transform,box-shadow] duration-200 hover:translate-x-[3px] hover:bg-acc-t2 data-active:translate-x-0 data-active:bg-acc data-active:font-medium data-active:text-white data-active:shadow-[0_4px_14px_rgba(79,86,211,0.32)] data-active:hover:bg-acc data-active:hover:text-white [&_svg]:size-[18px]";
const groupLabel = "h-auto px-[9px] pt-5 pb-2.5 text-[11px] font-normal tracking-[0.12em] text-muted-foreground uppercase";

export function AppSidebar({ user, aiWorkbench }: { user: SidebarUser | null; aiWorkbench: boolean }) {
  const pathname = usePathname();
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
      <UserCard user={user} active={isActive(pathname, "/account")} />
      <SidebarContent className="gap-0 px-2">
        {navGroups(user?.role ?? null, aiWorkbench).map((group) => (
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
                      <SidebarMenuButton isActive={isActive(pathname, href)} render={<Link href={href} />} className={navButton}>
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-line2 p-4">
        <div className="flex items-center gap-3 text-[13px] text-ink2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-ok-t text-ok" aria-hidden>
            <LockIcon className="size-[18px]" />
          </span>
          <span className="leading-snug">
            <span className="block font-semibold text-foreground">Office network only</span>
            Ticket data never goes to an AI model.
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/** The Careers profile block: large initials avatar with an accent ring, then name and role. Opens My account. */
function UserCard({ user, active }: { user: SidebarUser | null; active: boolean }) {
  const initials = user
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "";
  return (
    <div className="mx-4 border-b border-line">
      <Link
        href="/account"
        aria-label={user ? `My account: ${user.name}` : "My account"}
        className={cn(
          "my-2.5 flex flex-col items-center gap-1 rounded-xl px-4 pt-2.5 pb-3 transition-colors hover:bg-acc-t2 focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none",
          active && "bg-acc-t2",
        )}
      >
        <span
          className="mb-1.5 flex size-20 items-center justify-center rounded-full border-[3px] border-card bg-acc-t text-[28px] font-semibold text-acc-ink shadow-[0_0_0_2px_var(--acc-b)]"
          aria-hidden
        >
          {initials}
        </span>
        <span className="max-w-full truncate text-center text-[15px] font-semibold text-acc-ink">{user?.name ?? " "}</span>
        <span className="text-center text-[13px] text-muted-foreground">{user ? ROLE_LABELS[user.role] : " "}</span>
      </Link>
    </div>
  );
}
