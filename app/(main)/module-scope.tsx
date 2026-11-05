"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SelectField, type SelectOption } from "@/components/select-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** A module's score dot, explained on hover. Screen readers hear the explanation; the percentage is shown beside it. */
export function ScoreDot({ dot, text }: { dot: string; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex size-4 shrink-0 cursor-help items-center justify-center" />}>
        <span className={cn("size-2.5 rounded-full", dot)} aria-hidden />
        <span className="sr-only">{text}</span>
      </TooltipTrigger>
      <TooltipContent align="end" className="w-[16.25rem]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/** "Show modules for": changes `?modules=` so the choice survives a reload and can be shared. */
export function ModuleScope({ value, options }: { value: string; options: SelectOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <SelectField
      aria-label="Show modules for"
      value={value}
      options={options}
      className={cn("w-[12.5rem] max-sm:w-full", pending && "opacity-70")}
      onValueChange={(v) => start(() => router.replace(`/?modules=${encodeURIComponent(v)}`, { scroll: false }))}
    />
  );
}
