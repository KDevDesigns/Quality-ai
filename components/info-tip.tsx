"use client";

import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** A field's explanation behind a small info button beside its label, shown on hover and on keyboard focus. */
export function InfoTip({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`About ${label}: ${text}`}
            className={cn("inline-flex size-[1.125rem] shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground outline-none hover:text-primary-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
          />
        }
      >
        <InfoIcon className="size-4" aria-hidden />
      </TooltipTrigger>
      <TooltipContent align="start" className="w-[16.25rem]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
