"use client";

import { useActionState } from "react";
import { PencilIcon } from "lucide-react";
import { Field, FormMessage } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { updateModule } from "./actions";

export function ModuleDialog({ mod }: { mod: { id: string; name: string; description: string | null } }) {
  return (
    <FormDialog
      title={`Edit ${mod.name}`}
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${mod.name}`}>
          <PencilIcon />
        </Button>
      }
    >
      {(close) => <ModuleForm mod={mod} onDone={close} />}
    </FormDialog>
  );
}

function ModuleForm({ mod, onDone }: { mod: { id: string; description: string | null }; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await updateModule(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={mod.id} />
      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <Textarea id="description" name="description" defaultValue={mod.description ?? ""} rows={3} />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
