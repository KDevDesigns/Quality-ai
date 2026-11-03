import { cn } from "@/lib/utils";

// One row of the Settings list, like a phone's own settings: a coloured icon tile, the name, the current value on the
// right. Shared by the link rows (page.tsx) and the Appearance row (settings-bits.tsx).

const TILES = {
  indigo: "bg-[#4f56d3]",
  slate: "bg-[#64748b]",
  red: "bg-[#e5484d]",
  violet: "bg-[#8a5cf6]",
  amber: "bg-[#f59e0b]",
  teal: "bg-[#0ea5c6]",
  green: "bg-[#10a36b]",
} as const;
export type TileTone = keyof typeof TILES;

export const rowClass =
  "relative flex min-h-[3.25rem] w-full items-center gap-3 px-4 text-left outline-none hover:bg-acc-t2 focus-visible:bg-acc-t2 active:bg-surface3";

export function SettingsRowBody({ icon, tone, label, value }: { icon: React.ReactNode; tone: TileTone; label: string; value?: React.ReactNode }) {
  return (
    <>
      <span className={cn("flex size-[1.875rem] shrink-0 items-center justify-center rounded-lg text-white [&_svg]:size-[1.0625rem]", TILES[tone])} aria-hidden>
        {icon}
      </span>
      <span className="min-w-max flex-1 text-base">{label}</span>
      {value ? <span className="min-w-0 truncate text-[0.9375rem] text-muted-foreground max-[24rem]:text-[0.8438rem]">{value}</span> : null}
    </>
  );
}
