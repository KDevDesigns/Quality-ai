import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-[0.5625rem] border border-input bg-card px-3.5 py-2.5 text-[0.9375rem] leading-normal max-md:text-base transition-colors outline-none placeholder:text-(--placeholder) hover:border-(--input-hover) focus-visible:border-acc focus-visible:ring-3 focus-visible:ring-acc/15 disabled:cursor-not-allowed disabled:bg-surface3 disabled:opacity-60 aria-invalid:border-[0.0938rem] aria-invalid:border-destructive aria-invalid:bg-bad-t aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
