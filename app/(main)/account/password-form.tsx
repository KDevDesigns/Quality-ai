"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/form";
import { changePassword } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      {/* Side by side on a wide screen, as on the board; one under another when narrow. */}
      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        <Field label="Current password" htmlFor="current" error={err.current}>
          <PasswordInput id="current" name="current" autoComplete="current-password" required maxLength={200} aria-invalid={!!err.current} />
        </Field>
        <Field label="New password" htmlFor="next" error={err.next}>
          <PasswordInput id="next" name="next" autoComplete="new-password" required minLength={10} maxLength={200} aria-invalid={!!err.next} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={err.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required maxLength={200} aria-invalid={!!err.confirm} />
        </Field>
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</Button>
      </div>
    </form>
  );
}
