"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { CodeIcon, FlaskConicalIcon, MailCheckIcon, MailIcon, UserIcon } from "lucide-react";
import { Field, FormMessage } from "@/components/form-field";
import { InfoTip } from "@/components/info-tip";
import { IconField } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialFormState } from "@/lib/form";
import { EMAIL_DOMAIN, NICKNAME_MAX, SIGNUP_ROLES } from "@/lib/schemas/user";
import { cn } from "@/lib/utils";
import { signup, type SignupState } from "./actions";

const ROLE_CARDS: Record<(typeof SIGNUP_ROLES)[number], { label: string; hint: string; icon: typeof CodeIcon }> = {
  QA: { label: "QA tester", hint: "I test the ERP and file tickets", icon: FlaskConicalIcon },
  DEV: { label: "Developer", hint: "I fix tickets for my modules", icon: CodeIcon },
};

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initialFormState as SignupState);
  const [role, setRole] = useState<string>("");
  const err = state.fieldErrors ?? {};

  if (state.ok) {
    const approved = state.again === "approved";
    return (
      <div className="auth-enter grid gap-5 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-t text-ok" aria-hidden>
          <MailCheckIcon className="size-7" />
        </span>
        <div>
          <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">{approved ? "You're already approved" : state.again ? "Request updated" : "Request sent"}</h2>
          <p className="mt-2.5 text-base leading-normal text-muted-foreground">
            {approved
              ? "Go to Sign in on this browser and press Show my temporary password."
              : "Message a QA Hub admin that you signed up, so they know it's you. Once it's approved, open Sign in on this same browser to get your temporary password."}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/login" />} className="h-[3.125rem] text-base">
          {approved ? "Go to sign in" : "Back to sign in"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        // Submitting this way keeps the typed values if the server sends back a validation error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="auth-enter grid gap-[1.125rem]"
    >
      <div className="mb-1.5">
        <h2 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Request an account</h2>
        <p className="mt-2.5 text-base leading-normal text-muted-foreground">
          An admin reviews your request. Once it&apos;s approved, this browser gets your temporary password on the sign-in page. You choose your own at first sign-in.
        </p>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          I am a…
          <InfoTip label="I am a…" text="QA testers file tickets; developers fix the ones assigned to them. An admin can change it later." />
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {SIGNUP_ROLES.map((r) => {
            const { label, hint, icon: Icon } = ROLE_CARDS[r];
            return (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-colors hover:border-acc-b has-focus-visible:ring-3 has-focus-visible:ring-acc/30",
                  role === r ? "border-acc bg-acc-t2" : "border-line bg-card",
                )}
              >
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" required />
                <span className={cn("flex size-10 items-center justify-center rounded-full", role === r ? "bg-acc text-primary-foreground" : "bg-acc-t text-acc")} aria-hidden>
                  <Icon className="size-5" />
                </span>
                <span className="text-[0.9375rem] font-semibold">{label}</span>
                <span className="text-[0.7813rem] leading-snug text-muted-foreground">{hint}</span>
              </label>
            );
          })}
        </div>
        {err.role?.length ? <p className="text-[0.7813rem] font-medium text-destructive">{err.role.join(" ")}</p> : null}
      </fieldset>

      <Field label="Nickname" htmlFor="name" error={err.name} tip="What the team calls you. It's shown on your tickets and replies.">
        <IconField icon={UserIcon}>
          <Input id="name" name="name" placeholder="e.g. Kevin" autoComplete="nickname" required minLength={2} maxLength={NICKNAME_MAX} aria-invalid={!!err.name} className="h-12 pl-[2.625rem]" />
        </IconField>
      </Field>
      <Field label="Email" htmlFor="email" error={err.email} tip={`Your @${EMAIL_DOMAIN} office email. The admin checks it before approving.`}>
        <IconField icon={MailIcon}>
          <Input id="email" name="email" type="email" placeholder="you@davao-water.gov.ph" autoComplete="email" required maxLength={200} aria-invalid={!!err.email} className="h-12 pl-[2.625rem]" />
        </IconField>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="mt-2 h-[3.125rem] text-base">{pending ? "Sending…" : "Request account"}</Button>
    </form>
  );
}
