import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/** Hover lifts 1 px, except on anything disabled. `not-` rather than `enabled:`, because a Button can render as a link. */
const lift = "not-disabled:not-data-disabled:hover:-translate-y-px not-disabled:not-data-disabled:hover:shadow-(--shadow-hover)"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-180 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px active:shadow-none! data-disabled:cursor-not-allowed data-disabled:border-disabled-bg! data-disabled:bg-disabled-bg! data-disabled:text-disabled-text! data-disabled:shadow-none! data-disabled:translate-y-0! disabled:cursor-not-allowed disabled:border-disabled-bg! disabled:bg-disabled-bg! disabled:text-disabled-text! disabled:shadow-none! disabled:translate-y-0! aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: cn(lift, "border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover"),
        outline: cn(lift, "border-line bg-card text-foreground hover:bg-row-hover aria-expanded:bg-row-hover"),
        secondary:
          cn(lift, "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground"),
        soft: cn(lift, "border-acc-b bg-acc-t text-primary-text"),
        ghost:
          "text-ink2 hover:bg-surface3 hover:text-foreground aria-expanded:bg-surface3 aria-expanded:text-foreground",
        destructive:
          cn(lift, "bg-destructive text-white hover:bg-[color-mix(in_srgb,var(--destructive)_86%,black)] focus-visible:ring-destructive"),
        "ghost-red": cn(lift, "border-bad-b bg-card text-bad hover:bg-bad-w"),
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 pointer-coarse:h-11 text-[0.9375rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),0.625rem)] px-2 text-xs in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        // On touch screens the small sizes grow to 44 px, the minimum comfortable finger target.
        sm: "h-[2.125rem] gap-1.5 px-3 text-sm pointer-coarse:h-11 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[3.125rem] gap-2 px-4 text-[0.9688rem]",
        icon: "size-[2.375rem] rounded-[0.5625rem] pointer-coarse:size-11",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),0.625rem)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-[2.125rem] pointer-coarse:size-11",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
