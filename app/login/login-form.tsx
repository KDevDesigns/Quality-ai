"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockIcon, MailIcon } from "lucide-react";
import { ResetSplash } from "@/components/app-splash";
import { Field, FormMessage } from "@/components/form-field";
import { IconField, PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialFormState } from "@/lib/form";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="auth-enter grid gap-[1.125rem]">
      <ResetSplash />
      <div className="mb-1.5">
        <h2 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em]">Sign in</h2>
        <p className="mt-2.5 text-base leading-normal text-muted-foreground">Welcome back. Sign in to file tickets and follow up with the team.</p>
      </div>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email" error={err.email}>
        <IconField icon={MailIcon}>
          <Input id="email" name="email" type="email" placeholder="you@davao-water.gov.ph" autoComplete="username" required autoFocus maxLength={200} aria-invalid={!!err.email} className="h-12 pl-[2.625rem]" />
        </IconField>
      </Field>
      <Field label="Password" htmlFor="password" error={err.password}>
        <PasswordInput id="password" name="password" icon={LockIcon} placeholder="Enter your password" autoComplete="current-password" required maxLength={200} aria-invalid={!!err.password} className="h-12" />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="mt-2 h-[3.125rem] text-base">{pending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login?mode=forgot" className="font-medium text-acc hover:underline">Forgot your password?</Link>
      </p>
    </form>
  );
}
