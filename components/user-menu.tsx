"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { useTheme } from "next-themes";
import { CheckIcon, ChevronsUpDownIcon, LogOutIcon, UserRoundCogIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { signOutHere } from "@/lib/tickets/sign-out";
import { MODES } from "@/components/appearance-picker";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { setAccent, useAccent } from "@/components/theme";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ACCENTS, isAccent } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { SidebarUser } from "./app-sidebar";
import { UserAvatar } from "./user-avatar";

const item =
  "flex h-11 cursor-default items-center gap-2.5 rounded-[0.625rem] px-3 text-[0.9375rem] font-medium outline-hidden select-none data-highlighted:bg-row-hover [&_svg]:size-4 [&_svg]:text-ink2";

/** The signed-in person at the bottom of the sidebar. Opens Appearance, My account and Sign out above it. */
export function UserMenu({ user, active }: { user: SidebarUser; active: boolean }) {
  const [signingOut, startTransition] = useTransition();
  const mobile = useIsMobile();
  const { state } = useSidebar();
  return (
    <Menu.Root>
      <Tooltip>
        <TooltipTrigger
          render={
            <Menu.Trigger
              aria-label={`Open profile menu for ${user.name}`}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors duration-200 hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none data-popup-open:bg-row-hover",
                "group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-1",
                active && "bg-row-hover",
              )}
            />
          }
        >
          <UserAvatar person={user} className="size-10 text-sm" />
          <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
            <span className="text-[0.7813rem] text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" aria-hidden />
        </TooltipTrigger>
        {/* Minimised, the name isn't showing, so it comes as a tooltip. */}
        <TooltipContent side="right" hidden={state !== "collapsed"}>{user.name}</TooltipContent>
      </Tooltip>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="isolate z-50">
          <Menu.Popup className="w-[15.5rem] origin-(--transform-origin) rounded-[0.875rem] border border-line bg-popover p-2 text-popover-foreground shadow-(--shadow-dropdown) duration-300 ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Appearance />
            <Menu.Separator className="-mx-2 my-1 h-px bg-line2" />
            {/* On a phone, Settings is the list of everything My account has (and the bottom bar's tab). */}
            <Menu.Item className={item} render={<Link href={mobile ? "/settings" : "/account"} />}>
              <UserRoundCogIcon /> {mobile ? "Settings" : "My account"}
            </Menu.Item>
            <Menu.Item
              className={cn(item, "text-bad data-highlighted:bg-bad-w [&_svg]:text-bad")}
              disabled={signingOut}
              onClick={() => startTransition(() => signOutHere(logout))}
            >
              <LogOutIcon /> {signingOut ? "Signing out…" : "Sign out"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Light / dark / follow Windows, and the theme colour. Both are remembered in this browser only. */
function Appearance() {
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  return (
    <div className="grid gap-2.5 px-1 pt-1 pb-2">
      <Menu.Group className="grid gap-1.5">
        <Menu.GroupLabel className="text-xs font-semibold tracking-[0.06em] text-body2 uppercase">Mode</Menu.GroupLabel>
        <Menu.RadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(v)} className="grid grid-cols-3 gap-1 rounded-lg bg-surface3 p-1">
          {MODES.map(({ value, label, icon: Icon }) => (
            <Menu.RadioItem
              key={value}
              value={value}
              closeOnClick={false}
              className="flex h-8 cursor-default items-center justify-center gap-1 rounded-md text-[0.8125rem] text-muted-foreground outline-hidden select-none data-checked:bg-card data-checked:font-semibold data-checked:text-foreground data-checked:shadow-[0_0.0625rem_0.1875rem_rgba(20,20,40,0.12)] data-highlighted:text-foreground data-highlighted:ring-2 data-highlighted:ring-acc/40"
            >
              <Icon className="size-3.5" aria-hidden /> {label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Group>
      <Menu.Group className="grid gap-1.5">
        <Menu.GroupLabel className="text-xs font-semibold tracking-[0.06em] text-body2 uppercase">Theme colour</Menu.GroupLabel>
        <Menu.RadioGroup value={accent} onValueChange={(v) => isAccent(v) && setAccent(v)} className="flex gap-2">
          {ACCENTS.map((a) => (
            <Menu.RadioItem
              key={a.key}
              value={a.key}
              closeOnClick={false}
              label={a.label}
              aria-label={a.label}
              title={a.label}
              className="flex size-7 cursor-default items-center justify-center rounded-full outline-hidden ring-offset-2 ring-offset-popover data-checked:ring-2 data-checked:ring-foreground/70 data-highlighted:ring-2 data-highlighted:ring-acc/50"
              style={{ backgroundColor: a.color }}
            >
              <Menu.RadioItemIndicator>
                <CheckIcon className="size-3.5 text-white" strokeWidth={3} aria-hidden />
              </Menu.RadioItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Group>
    </div>
  );
}
