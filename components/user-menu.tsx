"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { useTheme } from "next-themes";
import { CheckIcon, ChevronDownIcon, ImagePlusIcon, LogOutIcon, Trash2Icon, UserRoundCogIcon, XIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { signOutHere } from "@/lib/tickets/sign-out";
import { MODES } from "@/components/appearance-picker";
import { useIsMobile } from "@/hooks/use-mobile";
import { setAccent, useAccent } from "@/components/theme";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ACCENTS, isAccent } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { SidebarUser } from "./app-sidebar";
import { useAvatarUpload } from "./avatar-upload";
import { InlineAlert } from "./inline-alert";
import { UserAvatar } from "./user-avatar";

const item =
  "flex h-10 cursor-default items-center gap-2.5 rounded-md px-3 text-[0.9063rem] outline-hidden select-none data-highlighted:bg-acc-t2 data-highlighted:text-acc-ink [&_svg]:size-4 [&_svg]:text-ink2 data-highlighted:[&_svg]:text-acc";

/** The signed-in person in the topbar: avatar, name and role. Opens My account and Sign out. */
export function UserMenu({ user, active }: { user: SidebarUser; active: boolean }) {
  const [signingOut, startTransition] = useTransition();
  const mobile = useIsMobile();
  const upload = useAvatarUpload();
  return (
    <>
    {upload.input}
    {upload.error ? (
      <div className="fixed top-20 right-4 z-50 flex max-w-sm items-start gap-1 rounded-[0.625rem] bg-popover shadow-md">
        <InlineAlert tone="bad" role="alert" className="min-w-0 flex-1">
          {upload.error}
        </InlineAlert>
        <button type="button" aria-label="Dismiss" onClick={upload.clearError} className="m-2 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-surface3 focus-visible:ring-3 focus-visible:ring-acc/30">
          <XIcon className="size-4" aria-hidden />
        </button>
      </div>
    ) : null}
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account menu for ${user.name}`}
        className={cn(
          "flex h-[2.875rem] items-center gap-2.5 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-acc-t2 focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none data-popup-open:bg-acc-t2",
          active && "bg-acc-t2",
        )}
      >
        <UserAvatar person={user} className={cn("size-[2.375rem] border-2 border-card text-[0.875rem] shadow-[0_0_0_0.125rem_var(--acc-b)]", upload.busy && "animate-pulse")} />
        <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
          <span className="max-w-44 truncate text-[0.875rem] font-semibold text-foreground">{user.name}</span>
          <span className="text-[0.75rem] text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="isolate z-50">
          <Menu.Popup className="w-72 origin-(--transform-origin) rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-150 ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="px-3 pt-2 pb-2.5">
              <div className="truncate text-[0.9063rem] font-semibold">{user.name}</div>
              <div className="text-[0.7813rem] text-muted-foreground">{ROLE_LABELS[user.role]}</div>
            </div>
            <Menu.Separator className="-mx-1.5 my-1 h-px bg-line2" />
            {user.mustChangePassword ? null : (
              <>
                <Menu.Item className={item} disabled={upload.busy} onClick={upload.choose}>
                  <ImagePlusIcon /> {upload.busy ? "Please wait…" : user.avatarName ? "Change photo" : "Upload photo"}
                </Menu.Item>
                {user.avatarName ? (
                  <Menu.Item className={item} disabled={upload.busy} onClick={upload.remove}>
                    <Trash2Icon /> Remove photo
                  </Menu.Item>
                ) : null}
                <Menu.Separator className="-mx-1.5 my-1 h-px bg-line2" />
              </>
            )}
            <Appearance />
            <Menu.Separator className="-mx-1.5 my-1 h-px bg-line2" />
            {/* On a phone, Settings is the list of everything My account has (and the bottom bar's tab). */}
            <Menu.Item className={item} render={<Link href={mobile ? "/settings" : "/account"} />}>
              <UserRoundCogIcon /> {mobile ? "Settings" : "My account"}
            </Menu.Item>
            <Menu.Item className={item} disabled={signingOut} onClick={() => startTransition(() => signOutHere(logout))}>
              <LogOutIcon /> {signingOut ? "Signing out…" : "Sign out"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
    </>
  );
}

/** Light / dark / follow Windows, and the theme colour. Both are remembered in this browser only. */
function Appearance() {
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  return (
    <div className="grid gap-2.5 px-3 pt-1.5 pb-2.5">
      <Menu.Group className="grid gap-1.5">
        <Menu.GroupLabel className="text-[0.7188rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Mode</Menu.GroupLabel>
        <Menu.RadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(v)} className="grid grid-cols-3 gap-1 rounded-lg bg-surface3 p-1">
          {MODES.map(({ value, label, icon: Icon }) => (
            <Menu.RadioItem
              key={value}
              value={value}
              closeOnClick={false}
              className="flex h-8 cursor-default items-center justify-center gap-1.5 rounded-md text-[0.8125rem] text-muted-foreground outline-hidden select-none data-checked:bg-card data-checked:font-semibold data-checked:text-foreground data-checked:shadow-[0_0.0625rem_0.1875rem_rgba(20,20,40,0.12)] data-highlighted:text-foreground data-highlighted:ring-2 data-highlighted:ring-acc/40"
            >
              <Icon className="size-3.5" aria-hidden /> {label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Group>
      <Menu.Group className="grid gap-1.5">
        <Menu.GroupLabel className="text-[0.7188rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Theme colour</Menu.GroupLabel>
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
