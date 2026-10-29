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
  children,
}: {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  wide?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const guard = useCloseGuardRef();
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && !closeAllowed(guard)) return details.cancel();
        setOpen(next);
      }}
    >
      <DialogTrigger render={trigger} />
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
