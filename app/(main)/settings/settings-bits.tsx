"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { ChevronRightIcon, LogOutIcon, MoonIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { AppearancePicker, MODES } from "@/components/appearance-picker";
import { NavCount, useNotifications } from "@/components/notifications";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SettingsRowBody, rowClass } from "./settings-row";

/** Sign-up and password-reset requests waiting for an admin, live from the bell's poll. */
export function RequestsCount() {
  const { data } = useNotifications();
  return <NavCount count={data?.requests ?? 0} label="waiting" />;
}

/** Appearance: the current mode on the right; opens a sheet with mode and theme colour. */
export function AppearanceRow() {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const mode = MODES.find((m) => m.value === (theme ?? "system"))?.label ?? "System";
  return (
    <li>
      <button type="button" onClick={() => setOpen(true)} className={rowClass}>
        <SettingsRowBody icon={<MoonIcon />} tone="teal" label="Appearance" value={mode} />
        <ChevronRightIcon className="size-[1.125rem] shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-0 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="px-0 pt-5 pb-4">
            <SheetTitle className="text-xl font-semibold">Appearance</SheetTitle>
            <SheetDescription>Remembered in this browser only.</SheetDescription>
          </SheetHeader>
          <AppearancePicker />
        </SheetContent>
      </Sheet>
    </li>
  );
}

export function SignOutRow() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => logout())}
      className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 px-4 text-base font-semibold text-bad outline-none focus-visible:bg-bad-t active:bg-surface3 disabled:opacity-60"
    >
      <LogOutIcon className="size-[1.125rem]" aria-hidden /> {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
