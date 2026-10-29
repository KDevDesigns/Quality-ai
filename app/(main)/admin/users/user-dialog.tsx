"use client";

import { useActionState, useCallback, useState, useTransition } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, KeyRoundIcon, PencilIcon, PlusIcon } from "lucide-react";
import { closeAllowed, CloseGuardProvider, useCloseGuard, useCloseGuardRef } from "@/components/close-guard";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/auth/permissions";
import { initialFormState } from "@/lib/form";
import { NICKNAME_MAX } from "@/lib/schemas/user";
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
      <Field label="Nickname" htmlFor="name" error={err.name} hint="What the team calls them. It's shown on their tickets and replies." required>
        <Input id="name" name="name" defaultValue={user?.name} required minLength={2} maxLength={NICKNAME_MAX} placeholder="e.g. Kevin" aria-invalid={!!err.name} />
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

/**
 * Copies text. navigator.clipboard only works on HTTPS or localhost; other office PCs reach QA Hub over plain HTTP,
 * so fall back to the older copy command, which still works there.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the fallback
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** The one-time temporary password, hidden until the admin chooses to show it, with a copy button that works either way. */
export function TempPassword({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [confirming, setConfirming] = useState(false);
  const doCopy = async () => setCopy((await copyText(password)) ? "copied" : "failed");

  // Closing before the password was copied or shown would lose it for good, so ask first: on Done, and through the
  // dialog's own close (X, Esc, a click outside).
  const secured = shown || copy === "copied";
  const check = useCallback(() => {
    if (secured) return true;
    setConfirming(true);
    return false;
  }, [secured]);
  useCloseGuard(check);

  if (confirming) {
    return (
      <div className="grid gap-4">
        <InlineAlert tone="warn" role="alert">
          <span className="font-semibold">You haven&apos;t copied the password yet.</span> Once this box is closed it can&apos;t be shown again, and
          you&apos;d have to reset the password to get a new one.
        </InlineAlert>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDone}>Close anyway</Button>
          <Button type="button" onClick={() => setConfirming(false)} autoFocus>Go back to the password</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <InlineAlert tone="ok" role="status">
        Give these sign-in details to the user. The password is shown only once and isn&apos;t emailed, so copy it now.
      </InlineAlert>
      <dl className="grid gap-3 rounded-[10px] border border-line bg-surface2 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate font-mono">{email}</dd>
        </div>
        <div className="grid gap-2">
          <dt className="text-muted-foreground">Temporary password</dt>
          <dd className="flex items-center gap-1.5">
            <span
              className="flex h-10 min-w-0 flex-1 items-center rounded-lg border border-line bg-card px-3 font-mono text-base font-semibold tracking-wider select-all"
              aria-label={shown ? `Temporary password ${password.split("").join(" ")}` : "Temporary password, hidden"}
            >
              {shown ? password : "•".repeat(password.length)}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setShown(!shown)} aria-pressed={shown} className="h-10">
              {shown ? <EyeOffIcon /> : <EyeIcon />} {shown ? "Hide" : "Show"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={doCopy} className="h-10">
              {copy === "copied" ? <CheckIcon className="text-ok" /> : <CopyIcon />} {copy === "copied" ? "Copied" : "Copy"}
            </Button>
          </dd>
          <p role="status" className="text-[12.5px] text-muted-foreground">
            {copy === "copied"
              ? "Copied to the clipboard. Paste it to the user, then clear it from wherever you pasted it."
              : copy === "failed"
                ? "This browser blocked copying. Click Show, then select the password and press Ctrl+C."
                : null}
          </p>
        </div>
      </dl>
      <div className="flex justify-end">
        <Button type="button" onClick={() => check() && onDone()}>Done</Button>
      </div>
    </div>
  );
}

export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UserFormState | null>(null);
  const guard = useCloseGuardRef();

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && !closeAllowed(guard)) return details.cancel();
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
          <CloseGuardProvider value={guard}>
            <TempPassword
              email={result.email ?? ""}
              password={result.tempPassword}
              onDone={() => {
                setOpen(false);
                setResult(null);
              }}
            />
          </CloseGuardProvider>
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
