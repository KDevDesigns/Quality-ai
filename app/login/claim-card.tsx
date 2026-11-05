"use client";

import { useState, useTransition } from "react";
import { CheckIcon, CopyIcon, HourglassIcon, KeyRoundIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { claimTempPassword, type ClaimState } from "./actions";

/**
 * This browser's sign-up request on the sign-in page. Waiting: a note to wait for the admin. Approved: a button that
 * shows a temporary password in a pop-up, a new one each time, at most once a minute.
 */
export function ClaimCard({ status }: { status: { state: "waiting" | "approved"; name: string } }) {
  const [result, setResult] = useState<ClaimState | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  if (status.state === "waiting") {
    return (
      <InlineAlert tone="warn" role="status">
        <span className="flex items-start gap-2.5">
          <HourglassIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Your request is waiting for an admin&apos;s approval. Once it&apos;s approved, come back here on this browser to get your temporary password.
          </span>
        </span>
      </InlineAlert>
    );
  }

  const show = () =>
    start(async () => {
      setCopied(false);
      setResult(await claimTempPassword());
    });

  return (
    <div className="grid gap-2.5 rounded-xl border border-ok-b bg-ok-t px-4 py-3.5 text-sm">
      <p className="flex items-start gap-2.5">
        <KeyRoundIcon className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        <span>
          <strong className="font-semibold">Your account is approved, {status.name}.</strong> Get your temporary password, sign in with it, then choose your own.
        </span>
      </p>
      <Button type="button" variant="outline" onClick={show} disabled={pending}>
        {pending ? "Making it…" : "Show my temporary password"}
      </Button>
      {result && !result.ok ? <p role="alert" className="text-[0.8125rem] font-medium text-destructive-text">{result.message}</p> : null}

      <Dialog open={!!result?.ok} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your temporary password</DialogTitle>
            <DialogDescription>
              Sign in as <span className="font-mono">{result?.email}</span> with this password, then choose your own. It only shows now; if you lose it, press the button again in a minute for a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface2 px-3.5 py-3">
            <span className="min-w-0 flex-1 font-mono text-lg font-semibold tracking-[0.06em] break-all select-all">{result?.tempPassword}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!result?.tempPassword) return;
                try {
                  await navigator.clipboard.writeText(result.tempPassword);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setResult(null)}>I have it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
