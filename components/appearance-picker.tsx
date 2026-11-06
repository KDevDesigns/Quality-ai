"use client";

import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { setAccent, useAccent, useThemeSwitch } from "@/components/theme";
import { ACCENTS } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Light / dark / follow the device, and the theme colour, as plain radio groups for the phone Settings page. The
// account menu has the same choices as menu items (components/user-menu.tsx). Both are remembered in this browser only.

export const MODES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function AppearancePicker() {
  const { theme, setTheme } = useThemeSwitch();
  const accent = useAccent();
  const mode = theme ?? "system";
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Mode</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface3 p-1">
          {MODES.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm has-focus-visible:ring-2 has-focus-visible:ring-acc/40",
                mode === value ? "bg-card font-semibold text-foreground shadow-[0_0.0625rem_0.1875rem_rgba(20,20,40,0.12)]" : "text-muted-foreground",
              )}
            >
              <input type="radio" name="mode" value={value} checked={mode === value} onChange={(e) => setTheme(value, e.currentTarget.parentElement)} className="sr-only" />
              <Icon className="size-4" aria-hidden /> {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Theme colour</legend>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <label
              key={a.key}
              title={a.label}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-card has-checked:ring-2 has-checked:ring-foreground/70 has-focus-visible:ring-2 has-focus-visible:ring-acc/50"
              style={{ backgroundColor: a.color }}
            >
              <input type="radio" name="accent" value={a.key} checked={accent === a.key} onChange={() => setAccent(a.key)} aria-label={a.label} className="sr-only" />
              {accent === a.key ? <CheckIcon className="size-4 text-white" strokeWidth={3} aria-hidden /> : null}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
