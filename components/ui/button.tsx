import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--acc)_84%,black)]",
        outline:
          "border-line bg-card text-foreground hover:border-acc-b hover:bg-acc-t2 aria-expanded:bg-acc-t2",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        soft: "border-acc-b bg-acc-t text-acc-ink hover:bg-[color-mix(in_srgb,var(--acc)_15%,var(--sf))]",
        ghost:
          "text-ink2 hover:bg-surface3 hover:text-foreground aria-expanded:bg-surface3 aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white dark:text-background hover:bg-[color-mix(in_srgb,var(--destructive)_86%,black)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 pointer-coarse:h-11 text-[0.9375rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),0.625rem)] px-2 text-xs in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        // On touch screens the small sizes grow to 44 px, the minimum comfortable finger target.
        sm: "h-9 gap-1.5 px-3.5 text-sm pointer-coarse:h-11 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-[1.125rem] text-[0.9375rem]",
        icon: "size-10 pointer-coarse:size-11",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),0.625rem)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 pointer-coarse:size-11",
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
