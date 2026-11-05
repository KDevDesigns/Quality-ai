"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { closeAllowed, CloseGuardProvider, useCloseGuardRef } from "@/components/close-guard";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FormState } from "@/lib/form";
import { approveSignUp, dismissResetRequest, rejectSignUp, type UserFormState } from "./actions";
import { ResetPasswordButton, TempPassword } from "./user-dialog";

// Approving moves the request out of the "Waiting for approval" list as soon as the page refreshes, which would take
// a dialog inside that row with it, temporary password and all. So the dialog lives in ApprovalHost, which wraps the
// whole page and stays mounted while the list changes underneath it.

type Target = { id: string; name: string };
const ApprovalContext = createContext<((t: Target) => void) | null>(null);

export function ApprovalHost({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [result, setResult] = useState<UserFormState | null>(null);
  const [pending, startTransition] = useTransition();
  const guard = useCloseGuardRef();
  const router = useRouter();

  const close = () => {
    const approved = result?.ok;
    setTarget(null);
    setResult(null);
    if (approved) router.refresh();
  };

  return (
    <ApprovalContext.Provider value={setTarget}>
      {children}
      <Dialog
        open={target !== null}
        onOpenChange={(next, details) => {
          if (next) return;
          if (!closeAllowed(guard)) return details.cancel();
          close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {target?.name}?</DialogTitle>
            <DialogDescription>QA Hub creates a temporary password for you to give them. They must choose their own at first sign-in.</DialogDescription>
          </DialogHeader>
          {result?.ok && result.tempPassword ? (
            <CloseGuardProvider value={guard}>
              <TempPassword email={result.email ?? ""} password={result.tempPassword} onDone={close} />
            </CloseGuardProvider>
          ) : (
            <>
              {result && !result.ok ? <InlineAlert tone="bad" role="alert">{result.message}</InlineAlert> : null}
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button disabled={pending || !target} onClick={() => target && startTransition(async () => setResult(await approveSignUp(target.id)))}>
                  {pending ? "Approving…" : "Approve and create password"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ApprovalContext.Provider>
  );
}

/** Approve (creates a one-time temporary password to hand over) or reject (deletes the request) one sign-up. */
export function PendingActions({ id, name }: { id: string; name: string }) {
  const openApproval = useContext(ApprovalContext);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const reject = () =>
    startTransition(async () => {
      const r: FormState = await rejectSignUp(id);
      setError(r.ok ? null : (r.message ?? "Something went wrong."));
    });

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error ? <span role="alert" className="mr-2 text-[0.7813rem] text-destructive-text">{error}</span> : null}
      <Button size="sm" onClick={() => openApproval?.({ id, name })} aria-label={`Approve ${name}`}>
        <CheckIcon /> Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={reject} aria-label={`Reject ${name}`} className="hover:bg-bad-t hover:text-bad">
        <XIcon /> Reject
      </Button>
    </div>
  );
}

/** A forgot-password request: reset (shows the temporary password to hand over) or dismiss it. */
export function ResetRequestActions({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dismiss = () =>
    startTransition(async () => {
      const r: FormState = await dismissResetRequest(id);
      setError(r.ok ? null : (r.message ?? "Something went wrong."));
    });

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error ? <span role="alert" className="mr-2 text-[0.7813rem] text-destructive-text">{error}</span> : null}
      <ResetPasswordButton id={id} name={name} labelled />
      <Button size="sm" variant="outline" disabled={pending} onClick={dismiss} aria-label={`Dismiss the request from ${name}`} className="hover:bg-bad-t hover:text-bad">
        <XIcon /> Dismiss
      </Button>
    </div>
  );
}
