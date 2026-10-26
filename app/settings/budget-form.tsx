"use client";

import { useActionState } from "react";
import { Field } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialFormState } from "@/lib/form";
import { saveBudget } from "./actions";

export function BudgetForm({ cap, maxOutputTokens }: { cap: number; maxOutputTokens: number }) {
  const [state, action, pending] = useActionState(saveBudget, initialFormState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly cloud cap (USD)" htmlFor="monthlyCapUsd" error={err.monthlyCapUsd} hint="Cloud calls are refused once this month's spend reaches the cap.">
          <Input id="monthlyCapUsd" name="monthlyCapUsd" type="number" min={0} max={1000} step="0.01" defaultValue={cap} aria-invalid={!!err.monthlyCapUsd} />
        </Field>
        <Field label="Max output tokens per call" htmlFor="maxOutputTokens" error={err.maxOutputTokens} hint="Upper limit applied to every task.">
          <Input id="maxOutputTokens" name="maxOutputTokens" type="number" min={256} max={64000} step={1} defaultValue={maxOutputTokens} aria-invalid={!!err.maxOutputTokens} />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-3">
        {state.message ? <InlineAlert tone={state.ok ? "ok" : "bad"} role="status" className="mr-auto py-2">{state.message}</InlineAlert> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save budget"}</Button>
      </div>
    </form>
  );
}
