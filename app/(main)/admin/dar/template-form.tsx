"use client";

import { useActionState } from "react";
import { Field, FormMessage, FormSection } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DarTemplate } from "@/lib/dar/template";
import { initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { FunctionsEditor } from "../../dar/functions-editor";
import { submitKeepingInput } from "../../tickets/ticket-form";
import { saveDarTemplate } from "./actions";

export function DarTemplateForm({ template: t }: { template: DarTemplate }) {
  const [state, action, pending] = useActionState(saveDarTemplate, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitKeepingInput(action)} className="grid gap-5">
      <FormSection>Header</FormSection>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Default position title" htmlFor="position" error={err.position} hint="Testers can set their own.">
          <Input id="position" name="position" defaultValue={t.position} maxLength={120} />
        </Field>
        <Field label="Department" htmlFor="department" error={err.department}>
          <Input id="department" name="department" defaultValue={t.department} maxLength={160} />
        </Field>
        <Field label="Unit" htmlFor="unit" error={err.unit}>
          <Input id="unit" name="unit" defaultValue={t.unit} maxLength={160} />
        </Field>
      </div>

      <FormSection>Signatories</FormSection>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Immediate supervisor (Confirmed by)" htmlFor="confirmedName" error={err.confirmedBy}>
          <Input id="confirmedName" name="confirmedName" defaultValue={t.confirmedBy.name} maxLength={120} />
        </Field>
        <Field label="Supervisor's title" htmlFor="confirmedTitle">
          <Input id="confirmedTitle" name="confirmedTitle" defaultValue={t.confirmedBy.title} maxLength={160} />
        </Field>
        <Field label="Noted by" htmlFor="notedName" error={err.notedBy}>
          <Input id="notedName" name="notedName" defaultValue={t.notedBy.name} maxLength={120} />
        </Field>
        <Field label="Noted by title" htmlFor="notedTitle">
          <Input id="notedTitle" name="notedTitle" defaultValue={t.notedBy.title} maxLength={160} />
        </Field>
      </div>

      <FormSection>Duties and MFOs</FormSection>
      <FunctionsEditor name="coreFunctions" label="A.) Core functions" initial={t.coreFunctions} />
      <FunctionsEditor name="supportFunctions" label="B.) Support functions" initial={t.supportFunctions} />
      {err.coreFunctions || err.supportFunctions ? <p className="text-[12.5px] font-medium text-destructive">Every row needs a duty.</p> : null}

      <FormMessage state={state} />
      <div className="flex items-center justify-end gap-3">
        <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !state.ok && "sr-only")}>{state.ok ? state.message : ""}</span>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save template"}</Button>
      </div>
    </form>
  );
}
