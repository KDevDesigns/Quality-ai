"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// QA Hub's dropdown (Base UI Select), styled like the text inputs: an animated list that grows from the trigger, a
// tick on the chosen item, keyboard and type-ahead. With `name` it posts its value like a native <select>.

const Select = SelectPrimitive.Root;

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" className={cn("min-w-0 flex-1 truncate text-left", className)} {...props} />;
}

function SelectTrigger({ className, size = "default", children, ...props }: SelectPrimitive.Trigger.Props & { size?: "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group/select flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-[0.5625rem] border border-line bg-card pr-3 pl-3.5 text-left text-[0.9375rem] text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 select-none",
        "hover:border-acc-b focus-visible:border-acc focus-visible:ring-3 focus-visible:ring-acc/15 data-popup-open:border-acc data-popup-open:ring-3 data-popup-open:ring-acc/15",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-placeholder:text-muted-foreground",
        "data-[size=default]:h-11 data-[size=sm]:h-9 data-[size=sm]:text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 ease-(--ease-out) group-data-popup-open/select:rotate-180" />}
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner side="bottom" sideOffset={6} align="start" alignItemWithTrigger={false} className="isolate z-50">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative max-h-[min(var(--available-height),20rem)] w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-[0.6875rem] border border-line bg-popover p-1 text-popover-foreground shadow-[0_0.75rem_2rem_rgba(20,24,40,0.14)] outline-none",
            "transition-[opacity,transform] duration-180 ease-(--ease-out) data-starting-style:-translate-y-1 data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0",
            className,
          )}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className="sticky top-0 z-10 flex h-6 w-full cursor-default items-center justify-center bg-popover">
            <ChevronUpIcon className="size-4 text-muted-foreground" />
          </SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow className="sticky bottom-0 z-10 flex h-6 w-full cursor-default items-center justify-center bg-popover">
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn("py-0.5", className)} {...props} />;
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={cn("px-2.5 pt-2 pb-1 text-[0.7188rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase", className)} {...props} />;
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-[0.4375rem] py-2 pr-8 pl-2.5 text-[0.9063rem] outline-none select-none transition-colors duration-100",
        "data-highlighted:bg-acc-t data-highlighted:text-acc-ink data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2 truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className="pop-in absolute right-2.5 flex size-4 items-center justify-center text-acc" />}>
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("pointer-events-none -mx-1 my-1 h-px bg-line", className)} {...props} />;
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue };
