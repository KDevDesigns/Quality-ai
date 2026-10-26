import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[9px] border border-line bg-card px-3.5 py-1 text-[15px] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-acc-b focus-visible:border-acc focus-visible:ring-3 focus-visible:ring-acc/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface3 disabled:opacity-60 aria-invalid:border-[1.5px] aria-invalid:border-destructive aria-invalid:bg-bad-t aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
