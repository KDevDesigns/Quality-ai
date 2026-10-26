"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { FormState } from "@/lib/form";

export function DeleteButton({
  id,
  label,
  action,
  detail,
}: {
  id: string;
  label: string;
  action: (id: string) => Promise<FormState>;
  detail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} className="hover:bg-bad-t hover:text-bad">
            <Trash2Icon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{label}”?</DialogTitle>
          <DialogDescription>{detail ?? "This cannot be undone."}</DialogDescription>
        </DialogHeader>
        {error ? <InlineAlert tone="bad" role="alert">{error}</InlineAlert> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await action(id);
                if (r.ok) setOpen(false);
                else setError(r.message ?? "Delete failed.");
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
