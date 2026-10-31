"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { ArrowLeftIcon, KeyRoundIcon, MailIcon } from "lucide-react";
import { Field, FormMessage } from "@/components/form-field";
import { IconField } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialFormState } from "@/lib/form";
import { EMAIL_DOMAIN } from "@/lib/schemas/user";
import { requestPasswordReset } from "./actions";

// QA Hub sends no email: the request waits in Admin → Users, and the admin hands over a temporary password in person.

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialFormState);
  const err = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="auth-enter grid gap-5 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-t text-ok" aria-hidden>
          <KeyRoundIcon className="size-7" />
        </span>
        <div>
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Request sent</h2>
          <p className="mt-2.5 text-base leading-normal text-muted-foreground">
            A QA Hub admin will reset your password and give you a temporary one. Sign in with it, then choose your own.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/login" />} className="h-[50px] text-base">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        // Submitting this way keeps the typed email if the server sends back an error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="auth-enter grid gap-[18px]"
    >
      <div className="mb-1.5">
        <h2 className="text-[32px] leading-tight font-semibold tracking-[-0.02em]">Forgot your password?</h2>
        <p className="mt-2.5 text-base leading-normal text-muted-foreground">
          Enter your email. An admin will reset your password and give you a temporary one.
        </p>
      </div>
      <Field label="Email" htmlFor="email" error={err.email} hint={`Your @${EMAIL_DOMAIN} office email.`}>
        <IconField icon={MailIcon}>
          <Input id="email" name="email" type="email" placeholder="you@davao-water.gov.ph" autoComplete="email" required autoFocus maxLength={200} aria-invalid={!!err.email} className="h-12 pl-[42px]" />
        </IconField>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="mt-2 h-[50px] text-base">{pending ? "Sending…" : "Send request"}</Button>
      <Link href="/login" className="mx-auto inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-acc">
        <ArrowLeftIcon className="size-3.5" aria-hidden /> Back to sign in
      </Link>
    </form>
  );
}
