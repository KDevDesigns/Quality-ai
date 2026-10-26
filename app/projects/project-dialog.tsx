"use client";

import { useActionState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Field, FormMessage } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { saveProject } from "./actions";

type ProjectValues = { id: string; name: string; description: string | null };

export function ProjectDialog({ project }: { project?: ProjectValues }) {
  return (
    <FormDialog
      title={project ? "Edit project" : "New project"}
      trigger={
        project ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${project.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button>
            <PlusIcon /> New project
          </Button>
        )
      }
    >
      {(close) => <ProjectForm project={project} onDone={close} />}
    </FormDialog>
  );
}

function ProjectForm({ project, onDone }: { project?: ProjectValues; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveProject(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);

  return (
    <form action={action} className="grid gap-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <Input id="name" name="name" defaultValue={project?.name} required maxLength={100} aria-invalid={!!state.fieldErrors?.name} />
      </Field>
      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <Textarea id="description" name="description" defaultValue={project?.description ?? ""} rows={3} />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
