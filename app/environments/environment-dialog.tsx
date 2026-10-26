"use client";

import { useActionState, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { saveEnvironment } from "./actions";

export type EnvironmentValues = {
  id: string;
  projectId: string;
  name: string;
  baseUrls: string[];
  apiBaseUrl: string | null;
  dbConnRef: string | null;
  isProduction: boolean;
  notes: string | null;
};

type ProjectOption = { id: string; name: string };

export function EnvironmentDialog({ env, projects }: { env?: EnvironmentValues; projects: ProjectOption[] }) {
  return (
    <FormDialog
      wide
      title={env ? `Edit ${env.name}` : "New environment"}
      description="Every URL the runner or explorer visits must fall under one of these base URLs."
      trigger={
        env ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${env.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button disabled={projects.length === 0}>
            <PlusIcon /> New environment
          </Button>
        )
      }
    >
      {(close) => <EnvironmentForm env={env} projects={projects} onDone={close} />}
    </FormDialog>
  );
}

function EnvironmentForm({ env, projects, onDone }: { env?: EnvironmentValues; projects: ProjectOption[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveEnvironment(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);
  const [isProduction, setIsProduction] = useState(env?.isProduction ?? false);
  const unprotecting = !!env?.isProduction && !isProduction;
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      {env ? <input type="hidden" name="id" value={env.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project" htmlFor="projectId" error={err.projectId}>
          <select id="projectId" name="projectId" defaultValue={env?.projectId ?? projects[0]?.id} className={nativeSelectClass} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Name" htmlFor="name" error={err.name}>
          <Input id="name" name="name" defaultValue={env?.name} placeholder="staging" required maxLength={60} aria-invalid={!!err.name} />
        </Field>
      </div>

      <Field
        label="Allowlisted base URLs"
        htmlFor="baseUrls"
        error={err.baseUrls}
        hint="One per line. Exact scheme, host and port must match; a path (e.g. /erp) restricts to that path and below."
      >
        <Textarea
          id="baseUrls"
          name="baseUrls"
          defaultValue={env?.baseUrls.join("\n")}
          placeholder={"https://erp-staging.example.local"}
          rows={3}
          className="font-mono text-xs"
          aria-invalid={!!err.baseUrls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="API base URL (optional)" htmlFor="apiBaseUrl" error={err.apiBaseUrl}>
          <Input id="apiBaseUrl" name="apiBaseUrl" defaultValue={env?.apiBaseUrl ?? ""} className="font-mono text-xs" aria-invalid={!!err.apiBaseUrl} />
        </Field>
        <Field label="DB connection env var (optional)" htmlFor="dbConnRef" error={err.dbConnRef} hint="The variable name in .env.local, never the connection string.">
          <Input id="dbConnRef" name="dbConnRef" defaultValue={env?.dbConnRef ?? ""} placeholder="ERP_STAGING_DB_URL" className="font-mono text-xs" aria-invalid={!!err.dbConnRef} />
        </Field>
      </div>

      <label
        className={
          "flex cursor-pointer items-start gap-3 rounded-[10px] p-3.5 text-sm transition-colors focus-within:ring-3 focus-within:ring-acc/25 " +
          (isProduction ? "border-2 border-bad-b bg-bad-t" : "border border-line bg-card hover:border-acc-b")
        }
      >
        <input
          type="checkbox"
          name="isProduction"
          checked={isProduction}
          onChange={(e) => setIsProduction(e.target.checked)}
          className="mt-0.5 size-[18px] accent-destructive"
        />
        <span>
          <span className="font-semibold">This is a production environment</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">Production environments are blocked from every run and exploration.</span>
        </span>
      </label>

      {unprotecting ? (
        <Field
          label={`Type "${env!.name}" to remove the production flag`}
          htmlFor="confirmUnprotect"
          error={err.confirmUnprotect}
        >
          <Input id="confirmUnprotect" name="confirmUnprotect" autoComplete="off" aria-invalid={!!err.confirmUnprotect} />
        </Field>
      ) : null}

      <Field label="Notes" htmlFor="notes" error={err.notes}>
        <Textarea id="notes" name="notes" defaultValue={env?.notes ?? ""} rows={2} />
      </Field>

      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
