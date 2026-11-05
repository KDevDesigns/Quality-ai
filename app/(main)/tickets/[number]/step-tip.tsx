"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * A step of the progress row with its explanation on hover and keyboard focus: whose move it is on the current step, when
 * the others happened (D21). Screen readers hear the same text.
 */
export function StepTip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="flex cursor-help items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />}
      >
        {children}
        <span className="sr-only">. {text}</span>
      </TooltipTrigger>
      <TooltipContent className="w-[17.5rem]">{text}</TooltipContent>
    </Tooltip>
  );
}
