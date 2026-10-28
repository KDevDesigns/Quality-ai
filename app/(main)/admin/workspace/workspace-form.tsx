"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { saveWorkspace } from "./actions";

export function WorkspaceForm({ aiWorkbench }: { aiWorkbench: boolean }) {
  const [state, action, pending] = useActionState(saveWorkspace, initialFormState);

  return (
    <form action={action} className="grid gap-4">
      <label className="flex items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" name="aiWorkbench" defaultChecked={aiWorkbench} className="size-4 accent-acc" />
        Show the AI workbench to admins
      </label>
      <FormMessage state={state} />
      <div className="flex items-center justify-end gap-3">
        <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !state.ok && "sr-only")}>{state.ok ? state.message : ""}</span>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
