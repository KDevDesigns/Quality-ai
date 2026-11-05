import { cn } from "@/lib/utils";

// Loading placeholders shaped like each page, shown while its data loads (the pages' <Suspense> fallbacks). A soft light
// sweeps across them (.skeleton-shine in app/globals.css); screen readers hear "Loading…" once.

export function Bone({ className, width }: { className?: string; width?: string }) {
  return <div aria-hidden className={cn("skeleton-shine rounded-md", className)} style={width ? { width } : undefined} />;
}

function Loading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Loading…" className={cn("grid gap-4", className)}>
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

const card = "rounded-[0.75rem] border border-line bg-card";

/** A page title and description, for pages whose header waits for the session. */
export function HeaderSkeleton() {
  return (
    <div className="grid gap-2.5 pb-2">
      <Bone className="h-7 w-48" />
      <Bone className="h-4 w-full max-w-md" />
    </div>
  );
}

/** Tickets list: the view tabs, the filter card and rows (chips and cards on phones). */
export function TicketListSkeleton({ rows = 8, header = false }: { rows?: number; header?: boolean }) {
  return (
    <Loading>
      {header ? <HeaderSkeleton /> : null}
      <div className="flex flex-wrap gap-2 md:gap-6 md:border-b md:border-line md:pb-3">
        {["7rem", "6rem", "9rem", "4rem", "3.5rem"].map((w, i) => (
          <Bone key={i} className="h-8 rounded-full md:h-5 md:rounded-md" width={w} />
        ))}
      </div>
      <div className={cn(card, "flex flex-wrap items-end gap-2.5 p-4 max-md:hidden")}>
        {["flex-[2_1_17.5rem]", "flex-[1_1_9.5rem]", "flex-[1_1_12rem]", "flex-[1_1_10rem]"].map((c, i) => (
          <div key={i} className={cn("grid min-w-0 gap-2", c)}>
            <Bone className="h-3.5 w-16" />
            <Bone className="h-11 w-full rounded-[0.5625rem]" />
          </div>
        ))}
      </div>
      <ListRows rows={rows} />
    </Loading>
  );
}

function ListRows({ rows }: { rows: number }) {
  return (
    <div className={cn(card, "divide-y divide-line overflow-hidden")}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-l-[0.1875rem] border-l-line px-4 py-3.5">
          <Bone className="h-4 w-10 shrink-0" />
          <div className="grid min-w-0 flex-1 gap-2">
            <Bone className={cn("h-4", i % 3 === 0 ? "w-3/5" : i % 3 === 1 ? "w-4/5" : "w-2/3")} />
            <div className="flex gap-2">
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-5 w-24" />
            </div>
          </div>
          <Bone className="hidden h-6 w-24 rounded-full sm:block" />
          <Bone className="hidden size-7 rounded-full md:block" />
        </div>
      ))}
    </div>
  );
}

/** One ticket: title and pills, the conversation, and the details panel beside it. */
export function TicketPageSkeleton() {
  return (
    <Loading>
      <div className="grid gap-3">
        <Bone className="h-4 w-24" />
        <Bone className="h-8 w-full max-w-xl" />
        <div className="flex gap-2">
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-6 w-24 rounded-full" />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="grid gap-4">
          <div className={cn(card, "grid gap-2.5 p-5")}>
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-3/4" />
            <Bone className="mt-2 h-40 w-full max-w-md rounded-[0.625rem]" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("flex gap-3", i === 1 && "flex-row-reverse")}>
              <Bone className="size-8 shrink-0 rounded-full" />
              <div className={cn(card, "grid w-full max-w-lg gap-2 p-4")}>
                <Bone className="h-3.5 w-28" />
                <Bone className="h-4 w-full" />
                <Bone className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className={cn(card, "grid gap-4 p-5")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-1.5">
              <Bone className="h-3 w-20" />
              <Bone className="h-5 w-36" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Dashboard: greeting, stat tiles, the ticket list beside the modules card, then Module progress. */
export function DashboardSkeleton() {
  return (
    <Loading className="gap-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(13.75rem,1fr))] gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(card, "grid gap-3 p-5")}>
            <Bone className="h-3.5 w-24" />
            <Bone className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_35rem]"><ListRows rows={5} /></div>
        <div className="min-w-0 flex-[1_1_20rem]"><ListRows rows={3} /></div>
      </div>
      <div className={cn(card, "grid gap-3 p-5")}>
        <Bone className="h-5 w-40" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(21.25rem,100%),1fr))] gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-2.5 rounded-[0.625rem] border border-line p-3.5">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** My inbox: the conversation list beside an empty conversation pane (the list alone on phones). */
export function InboxSkeleton() {
  return (
    <Loading className="desk:min-h-0 desk:flex-1">
      <div className={cn(card, "grid overflow-hidden lg:h-[calc(100dvh-17.5rem)] lg:min-h-130 lg:grid-cols-[minmax(18.75rem,23.75rem)_minmax(0,1fr)] desk:h-full!")}>
        <div className="flex flex-col border-line lg:border-r">
          <div className="grid gap-2.5 border-b border-line2 px-4 py-3.5">
            <Bone className="h-10 w-full" />
            <Bone className="h-9 w-full rounded-[0.625rem]" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid gap-1.5 border-b border-line2 px-4 py-3">
              <div className="flex justify-between">
                <Bone className="h-3 w-12" />
                <Bone className="h-3 w-8" />
              </div>
              <Bone className={cn("h-4", i % 2 ? "w-4/5" : "w-3/5")} />
              <Bone className="h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="hidden bg-surface2 lg:block" />
      </div>
    </Loading>
  );
}

/** Team & modules: the filter and module cards with people chips. */
export function TeamSkeleton() {
  return (
    <Loading>
      <HeaderSkeleton />
      <div className="flex gap-2">
        <Bone className="h-9 w-64" />
        <Bone className="h-9 w-16" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(card, "grid gap-3 p-5")}>
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-40" />
              <Bone className="h-5 w-12 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((j) => (
                <Bone key={j} className="h-7 w-24 rounded-full" />
              ))}
            </div>
            <Bone className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** My DAR: the toolbar and the report sheet. */
export function DarSkeleton() {
  return (
    <Loading>
      <HeaderSkeleton />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Bone className="h-11 w-72" />
        <div className="flex gap-2">
          {["7rem", "9rem", "5rem", "5rem", "6rem"].map((w, i) => (
            <Bone key={i} className="h-9" width={w} />
          ))}
        </div>
      </div>
      <div className={cn(card, "grid gap-3 p-5")}>
        <Bone className="mx-auto h-5 w-72" />
        <Bone className="mx-auto h-4 w-56" />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-5 w-full max-w-sm" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[2fr_2fr_repeat(8,1fr)] gap-1">
          {Array.from({ length: 40 }, (_, i) => (
            <Bone key={i} className="h-10 rounded-sm" />
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** A form page in a card: `sections` groups of fields. */
export function FormSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <Loading className={cn(card, "gap-6 p-6")}>
      {Array.from({ length: sections }, (_, i) => (
        <div key={i} className="grid gap-4">
          <Bone className="h-3.5 w-28" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((j) => (
              <div key={j} className="grid gap-2">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-11 w-full rounded-[0.5625rem]" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Bone className="h-10 w-32 justify-self-end rounded-[0.5625rem]" />
    </Loading>
  );
}

/** Account settings: the side tabs and one panel. */
export function AccountSkeleton() {
  return (
    <Loading className="gap-6 md:grid-cols-[13.75rem_minmax(0,1fr)]">
      <div className="flex gap-2 md:grid md:content-start">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-10 w-28 rounded-[0.5625rem] md:w-full" />
        ))}
      </div>
      <FormSkeleton sections={1} />
    </Loading>
  );
}

/** Admin tables (users): a toolbar and rows. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Loading>
      <HeaderSkeleton />
      <div className={cn(card, "divide-y divide-line overflow-hidden")}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Bone className="size-8 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-1.5">
              <Bone className="h-4 w-40" />
              <Bone className="h-3.5 w-56" />
            </div>
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-8 w-8" />
          </div>
        ))}
      </div>
    </Loading>
  );
}
