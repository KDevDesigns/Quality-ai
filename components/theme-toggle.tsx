"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeSwitch } from "./theme";

/**
 * One button between light and dark, left of the notifications bell. The new look grows out of the button in a circle
 * (useThemeSwitch). It shows the sun in light mode and the moon in dark mode from CSS alone, so it never flickers while
 * the page loads. "Follow Windows" stays in Settings → Appearance; pressing this picks light or dark for good.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useThemeSwitch();
  const icon = "absolute size-[1.125rem] transition-[rotate,scale,opacity] duration-500 ease-(--ease-out)";
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Dark mode"
      // The pressed state follows the page's class, which is right from the first paint (next-themes sets it before React).
      aria-pressed={resolvedTheme === "dark"}
      title="Switch between light and dark"
      onClick={(e) => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark", e.currentTarget)}
      className={cn("relative size-[2.375rem] overflow-hidden rounded-[0.5625rem] text-ink2", className)}
    >
      <SunIcon aria-hidden className={cn(icon, "scale-100 rotate-0 opacity-100 dark:scale-50 dark:-rotate-90 dark:opacity-0")} />
      <MoonIcon aria-hidden className={cn(icon, "scale-50 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100")} />
    </Button>
  );
}
