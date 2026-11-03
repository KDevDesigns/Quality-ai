"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/form-field";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { DEFAULT_TONE } from "@/lib/push/tones";
import { myTone, saveTone } from "./account/actions";
import { deviceState, turnOnDevice, type DeviceState } from "./account/device-push";
import { ToneSelect } from "./account/tone-select";

// After sign-in, offers device notifications on a device where they're off. Browsers only show their "Allow" question
// in answer to a click, so this dialog's Turn on is that click. Shown once per browser session; "Not now" hides it on
// this device for 14 days. Both are per-device conveniences, so browser storage is enough (and may be unavailable).

const SNOOZE_KEY = "qa-hub:push-prompt-snoozed-until";
const SESSION_KEY = "qa-hub:push-prompt-shown";
const SNOOZE_DAYS = 14;

function read(store: () => Storage, key: string): string | null {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
}

function write(store: () => Storage, key: string, value: string) {
  try {
    store().setItem(key, value);
  } catch {
    // Private windows can refuse storage; the prompt may then show again next time, which is harmless.
  }
}

export function PushPrompt() {
  const pathname = usePathname();
  const [state, setState] = useState<DeviceState | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState({ tone: DEFAULT_TONE });
  const [tone, setTone] = useState(DEFAULT_TONE);
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => {
    // My account has the full card, and the forced password change happens there. On New ticket it would interrupt filing,
    // or sit on top of the markup editor when a shared screenshot arrives.
    if (pathname === "/account" || pathname === "/tickets/new") return;
    if (read(() => sessionStorage, SESSION_KEY)) return;
    if (Number(read(() => localStorage, SNOOZE_KEY) ?? 0) > Date.now()) return;
    write(() => sessionStorage, SESSION_KEY, "1");
    deviceState().then(
      (s) => {
        if (s === "off" || s === "install") {
          setState(s);
          setOpen(true);
          myTone().then((t) => {
            setSaved(t);
            setTone(t.tone);
          }, () => {});
        }
      },
      () => {},
    );
  }, [pathname]);

  function notNow() {
    write(() => localStorage, SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
    setOpen(false);
  }

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    const r = await turnOnDevice();
    if (r.state === "on" && tone !== saved.tone) await saveTone(tone);
    setBusy(false);
    if (r.state === "on") return setOpen(false);
    setMessage(r.state === "blocked" ? "Notifications are blocked for QA Hub in this browser. You can allow them later in the site settings, then turn them on in My account." : (r.message ?? null));
  }

  if (!state) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : notNow())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn on notifications?</DialogTitle>
          <DialogDescription>
            {state === "install"
              ? "To get iPhone or iPad notifications, add QA Hub to your Home Screen first: tap Share, then Add to Home Screen. Open QA Hub from the new icon and sign in. Needs iOS 16.4 or newer."
              : "Get a Windows, Mac or phone notification when something happens on your tickets, even with QA Hub closed. You can change this any time in My account."}
          </DialogDescription>
        </DialogHeader>
        {state === "off" ? (
          <Field label="Sound" htmlFor="promptTone" hint="Plays while QA Hub is open. Change it any time in My account.">
            <ToneSelect id="promptTone" value={tone} onChange={setTone} />
          </Field>
        ) : null}
        {canInstall ? (
          <Button variant="outline" onClick={install} className="w-fit">
            <DownloadIcon /> Install QA Hub as an app
          </Button>
        ) : null}
        {message ? <InlineAlert tone="bad" role="alert">{message}</InlineAlert> : null}
        <DialogFooter>
          {state === "install" ? (
            <Button onClick={notNow}>Got it</Button>
          ) : (
            <>
              <Button variant="outline" onClick={notNow} disabled={busy}>Not now</Button>
              <Button onClick={turnOn} disabled={busy}>{busy ? "Turning on…" : "Turn on"}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
