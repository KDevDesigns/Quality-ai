import Link from "next/link";
import { cn } from "@/lib/utils";

// The Sign in / Sign up switch at the top of both auth screens, after the CRM portal's AuthTabs:
// a segmented control whose tabs are links, so each screen has its own URL.

const TABS = [
  { key: "signin", label: "Sign in", href: "/login" },
  { key: "signup", label: "Sign up", href: "/login?mode=signup" },
] as const;

export function AuthTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Sign in or sign up" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-surface3 p-1">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex h-11 items-center justify-center rounded-[9px] text-[15px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc",
              on ? "auth-tab-on bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(20,20,40,0.12)]" : "font-medium text-muted-foreground hover:bg-card/55 hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
