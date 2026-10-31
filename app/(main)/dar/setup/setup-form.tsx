"use client";

import { useActionState } from "react";
import { Field, FormMessage, FormSection } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DarHeader } from "@/lib/dar/template";
import { initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { submitKeepingInput } from "../../tickets/ticket-form";
import { saveDarProfile } from "../actions";
import { FunctionsEditor } from "../functions-editor";

// The person's own DAR set-up, laid out like the old shared DAR template page. Empty fields stay empty on the report.

export function DarSetupForm({ header: h, hasFullName }: { header: DarHeader; hasFullName: boolean }) {
  const [state, action, pending] = useActionState(saveDarProfile, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitKeepingInput(action)} className="grid gap-5">
      <FormSection>Header</FormSection>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={err.fullName} hint="As on official forms, e.g. Juan D. Dela Cruz. Your QA Hub nickname is used until you add it.">
          <Input id="fullName" name="fullName" defaultValue={hasFullName ? h.name : ""} maxLength={120} />
        </Field>
        <Field label="Position title" htmlFor="position" error={err.position}>
          <Input id="position" name="position" defaultValue={h.position} maxLength={120} placeholder="e.g. System Analyst" />
        </Field>
        <Field label="Department" htmlFor="department" error={err.department}>
          <Input id="department" name="department" defaultValue={h.department} maxLength={160} placeholder="e.g. Information and Communication Technology Department" />
        </Field>
        <Field label="Unit" htmlFor="unit" error={err.unit}>
          <Input id="unit" name="unit" defaultValue={h.unit} maxLength={160} placeholder="e.g. Data Management Unit" />
        </Field>
      </div>

      <FormSection>Signatories</FormSection>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Immediate supervisor (Confirmed by)" htmlFor="confirmedName" error={err.confirmedBy}>
          <Input id="confirmedName" name="confirmedName" defaultValue={h.confirmedBy.name} maxLength={120} />
        </Field>
        <Field label="Supervisor's title" htmlFor="confirmedTitle">
          <Input id="confirmedTitle" name="confirmedTitle" defaultValue={h.confirmedBy.title} maxLength={160} />
        </Field>
        <Field label="Noted by" htmlFor="notedName" error={err.notedBy}>
          <Input id="notedName" name="notedName" defaultValue={h.notedBy.name} maxLength={120} />
        </Field>
        <Field label="Noted by title" htmlFor="notedTitle">
          <Input id="notedTitle" name="notedTitle" defaultValue={h.notedBy.title} maxLength={160} />
        </Field>
      </div>

      <FormSection>Duties and MFOs</FormSection>
      <FunctionsEditor name="coreFunctions" label="A.) Core functions" initial={h.core} />
      <FunctionsEditor name="supportFunctions" label="B.) Support functions" initial={h.support} />
      {err.coreFunctions || err.supportFunctions ? <p className="text-[12.5px] font-medium text-destructive">Every row needs a duty.</p> : null}

      <FormMessage state={state} />
      <div className="flex items-center justify-end gap-3">
        <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !state.ok && "sr-only")}>{state.ok ? state.message : ""}</span>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save set-up"}</Button>
      </div>
    </form>
  );
}
