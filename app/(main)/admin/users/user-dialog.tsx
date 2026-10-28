"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/auth/permissions";
import { initialFormState } from "@/lib/form";
import { createUser, resetPassword, updateUser, type UserFormState } from "./actions";

type UserValues = { id: string; name: string; email: string; role: Role; active: boolean };

export function UserDialog({ user, isSelf }: { user?: UserValues; isSelf?: boolean }) {
  return (
    <FormDialog
      title={user ? "Edit user" : "New user"}
      description={user ? undefined : "They'll get a temporary password to change at first sign-in."}
      trigger={
        user ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${user.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button>
            <PlusIcon /> New user
          </Button>
        )
      }
    >
      {(close) => <UserForm user={user} isSelf={isSelf} onDone={close} />}
    </FormDialog>
  );
}

function UserForm({ user, isSelf, onDone }: { user?: UserValues; isSelf?: boolean; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: UserFormState, fd: FormData) => {
    const r = user ? await updateUser(prev, fd) : await createUser(prev, fd);
    if (r.ok && user) onDone();
    return r;
  }, initialFormState as UserFormState);
  const err = state.fieldErrors ?? {};

  if (state.ok && state.tempPassword) {
    return <TempPassword email={state.email ?? ""} password={state.tempPassword} onDone={onDone} />;
  }

  return (
    <form action={action} className="grid gap-4">
      {user ? <input type="hidden" name="id" value={user.id} /> : null}
      <Field label="Full name" htmlFor="name" error={err.name} required>
        <Input id="name" name="name" defaultValue={user?.name} required maxLength={100} aria-invalid={!!err.name} />
      </Field>
      <Field label="Email" htmlFor="email" error={err.email} hint="Used to sign in." required>
        <Input id="email" name="email" type="email" defaultValue={user?.email} required maxLength={200} aria-invalid={!!err.email} />
      </Field>
      <Field label="Role" htmlFor="role" error={err.role} required>
        <select id="role" name="role" defaultValue={user?.role ?? "DEV"} className={nativeSelectClass}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </Field>
      {user ? (
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" name="active" defaultChecked={user.active} disabled={isSelf} className="size-4 accent-acc" />
          Account is active
          {isSelf ? <input type="hidden" name="active" value="on" /> : null}
        </label>
      ) : null}
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : user ? "Save" : "Create user"}</Button>
      </div>
    </form>
  );
}

function TempPassword({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // Clipboard access needs HTTPS or localhost; on plain-HTTP LAN the admin selects and copies by hand.
    }
  };
  return (
    <div className="grid gap-4">
      <InlineAlert tone="ok" role="status">Give these sign-in details to the user. The password is shown only once.</InlineAlert>
      <dl className="grid gap-2 rounded-[10px] border border-line bg-surface2 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-mono">{email}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Temporary password</dt>
          <dd className="flex items-center gap-1.5">
            <span className="font-mono text-base font-semibold tracking-wider select-all">{password}</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy password">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </dd>
        </div>
      </dl>
      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UserFormState | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Reset password for ${name}`}>
            <KeyRoundIcon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {name}?</DialogTitle>
          <DialogDescription>They’ll be signed out everywhere and must choose a new password at next sign-in.</DialogDescription>
        </DialogHeader>
        {result?.ok && result.tempPassword ? (
          <TempPassword email={result.email ?? ""} password={result.tempPassword} onDone={() => setOpen(false)} />
        ) : (
          <>
            {result && !result.ok ? <InlineAlert tone="bad" role="alert">{result.message}</InlineAlert> : null}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button disabled={pending} onClick={() => startTransition(async () => setResult(await resetPassword(id)))}>
                {pending ? "Resetting…" : "Reset password"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
