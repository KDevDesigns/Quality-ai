"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { Input } from "@/components/ui/input";
import { matchesModule, type DirectoryModule } from "@/lib/areas/directory";
import { cn } from "@/lib/utils";

export type ModuleLink = DirectoryModule & { href: string; selected: boolean; hidden: boolean };

/**
 * The module search and list on the left of Team & modules. The search narrows the list as you type (name or code,
 * sub-modules included); each module is a real link that opens it on the right.
 */
export function ModuleList({ modules, children }: { modules: ModuleLink[]; children?: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const shown = modules.filter((m) => matchesModule(m, query));
  return (
    <>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search module or code" aria-label="Search modules" className="h-10 pl-9" />
      </div>
      {children}
      <hr className="border-line2" />
      {shown.length ? (
        <nav aria-label="Module list" className="flex flex-col gap-0.5 desk:min-h-0 desk:flex-1 desk:overflow-y-auto desk:overscroll-contain">
          {shown.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              aria-current={m.selected ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9063rem] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                m.selected ? "bg-acc-t2 text-primary-text shadow-[inset_0_0_0_1px_var(--acc-b)]" : "text-ink2 hover:bg-row-hover",
              )}
            >
              <span className="w-11 shrink-0 truncate font-mono text-[0.7813rem] text-muted-foreground">{m.code}</span>
              <span className="min-w-0 flex-1 truncate" title={m.name}>{m.name}</span>
              {m.hidden ? <StatusPill tone="neutral">Hidden</StatusPill> : null}
            </Link>
          ))}
        </nav>
      ) : (
        <p className="px-2 py-5 text-center text-sm text-muted-foreground" role="status">
          No module matches. Clear the search or choose Everyone.
        </p>
      )}
    </>
  );
}
