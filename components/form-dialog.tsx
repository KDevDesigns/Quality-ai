"use client";

import { useState } from "react";
import { closeAllowed, CloseGuardProvider, useCloseGuardRef } from "@/components/close-guard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Client-only: `children` is a render function, so callers must themselves be client components. */
export function FormDialog({
  trigger,
  title,
  description,
  wide,
  open: openProp,
  onOpenChange,
  children,
}: {
  /** The button that opens it. Leave out when something else opens it through `open` (a menu item). */
  trigger?: React.ReactElement;
  title: string;
  description?: string;
  wide?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOpenState(next));
  const guard = useCloseGuardRef();
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && !closeAllowed(guard)) return details.cancel();
        setOpen(next);
      }}
    >
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className={wide ? "sm:max-w-2xl" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <CloseGuardProvider value={guard}>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{open ? children(() => setOpen(false)) : null}</div>
        </CloseGuardProvider>
      </DialogContent>
    </Dialog>
  );
}
