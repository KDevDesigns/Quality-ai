"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, FormMessage } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialFormState, type FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { DEFAULT_TONE } from "@/lib/push/tones";
import { TONE_MAX_BYTES, TONE_MAX_SECONDS } from "@/lib/uploads/limits";
import { removeTone, savePreviews, saveTone, saveWorkHours, sendTestPush, uploadTone } from "./actions";
import { currentSubscription, deviceState, turnOffDevice, turnOnDevice, type DeviceState } from "./device-push";
import { ToneSelect } from "./tone-select";

// Device notifications (Web Push) for this browser, and the person's work hours.

export function DeviceNotificationsCard() {
  const [state, setState] = useState<DeviceState>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    deviceState().then(setState, () => setState("off"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setNote(null);
    const r = await turnOnDevice();
    setState(r.state);
    if (r.message) setNote({ ok: false, message: r.message });
    setBusy(false);
  }

  async function turnOff() {
    setBusy(true);
    setNote(null);
    try {
      await turnOffDevice();
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setNote(null);
    try {
      const sub = await currentSubscription();
      const r = sub ? await sendTestPush(sub.endpoint) : { ok: false, message: "This device is off. Turn it on first." };
      setNote({ ok: r.ok, message: r.message ?? "" });
      if (!r.ok && !sub) setState("off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications on this device</CardTitle>
        <CardDescription>A Windows, Mac or phone notification when something happens on your tickets, even with QA Hub closed. Turn it on once on each device.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {state === "on" ? <InlineAlert tone="ok" role="status">On for this device. Your device&apos;s Do Not Disturb or Focus still mutes them.</InlineAlert> : null}
        {state === "off" ? <p className="text-sm text-muted-foreground">Off for this device. Your browser will ask for permission when you turn it on.</p> : null}
        {state === "blocked" ? (
          <InlineAlert tone="warn" role="status">
            Notifications are blocked for QA Hub in this browser. Click the icon left of the address bar, set Notifications to Allow, then reload this page.
          </InlineAlert>
        ) : null}
        {state === "install" ? (
          <InlineAlert tone="info" role="status">
            <span>
              On an iPhone or iPad, add QA Hub to your Home Screen first: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Open QA Hub from the new icon, sign
              in and come back to this page. Needs iOS 16.4 or newer.
            </span>
          </InlineAlert>
        ) : null}
        {state === "unsupported" ? <InlineAlert tone="warn" role="status">This browser can&apos;t show device notifications. Use Chrome, Edge, Firefox or Safari.</InlineAlert> : null}
        {state === "unset" ? <InlineAlert tone="info" role="status">Device notifications aren&apos;t set up on the server yet. Ask an admin.</InlineAlert> : null}
        {note && !note.ok ? <InlineAlert tone="bad" role="alert">{note.message}</InlineAlert> : null}

        {state === "on" || state === "off" ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !note?.ok && "sr-only")}>{note?.ok ? note.message : ""}</span>
            {state === "on" ? (
              <>
                <Button variant="outline" onClick={turnOff} disabled={busy}>Turn off</Button>
                <Button variant="outline" onClick={test} disabled={busy}>Send test</Button>
              </>
            ) : (
              <Button onClick={turnOn} disabled={busy}>{busy ? "Turning on…" : "Turn on"}</Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
/** 720 → "12:00 PM", 0 → "12:00 AM": in words, so noon and midnight can't be mixed up. */
const ampm = (min: number) => `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, "0")} ${min < 720 ? "AM" : "PM"}`;

export function WorkHoursCard({ initial }: { initial: { pushWorkHoursOnly: boolean; workStartMin: number; workEndMin: number; workDays: number } }) {
  const [state, action, pending] = useActionState(saveWorkHours, initialFormState);
  const [limited, setLimited] = useState(initial.pushWorkHoursOnly);
  const err = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work hours</CardTitle>
        <CardDescription>Outside these hours your devices stay quiet. Everything still shows in the bell and My inbox. Philippine time.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="pushWorkHoursOnly" checked={limited} onChange={(e) => setLimited(e.target.checked)} className="size-4 accent-acc" />
            Only notify me during work hours
          </label>
          {initial.pushWorkHoursOnly ? (
            <p className="text-[13px] text-muted-foreground">
              Saved: notifications from <strong className="text-foreground">{ampm(initial.workStartMin)}</strong> to <strong className="text-foreground">{ampm(initial.workEndMin)}</strong>
              {initial.workEndMin <= initial.workStartMin ? " (the next day)" : ""}. Quiet the rest of the time.
            </p>
          ) : null}
          <fieldset disabled={!limited} className="grid gap-4 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From" htmlFor="workStart" error={err.workStartMin}>
                <Input id="workStart" name="workStart" type="time" required defaultValue={hhmm(initial.workStartMin)} aria-invalid={!!err.workStartMin} />
              </Field>
              <Field label="To" htmlFor="workEnd" error={err.workEndMin}>
                <Input id="workEnd" name="workEnd" type="time" required defaultValue={hhmm(initial.workEndMin)} aria-invalid={!!err.workEndMin} />
              </Field>
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Days</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {DAYS.map((d, i) => (
                  <label key={d} className="flex items-center gap-2.5 text-sm">
                    <input type="checkbox" name="days" value={i} defaultChecked={!!(initial.workDays & (1 << i))} className="size-4 accent-acc" />
                    {d}
                  </label>
                ))}
              </div>
              {err.days?.length ? <p className="text-[12.5px] font-medium text-destructive">{err.days.join(" ")}</p> : null}
            </fieldset>
          </fieldset>
          {/* A disabled fieldset sends no values; keep the saved hours when the switch is off. */}
          {!limited ? (
            <>
              <input type="hidden" name="workStart" value={hhmm(initial.workStartMin)} />
              <input type="hidden" name="workEnd" value={hhmm(initial.workEndMin)} />
              {DAYS.map((d, i) => (initial.workDays & (1 << i) ? <input key={d} type="hidden" name="days" value={i} /> : null))}
            </>
          ) : null}
          <FormMessage state={state} />
          <div className="flex items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !state.ok && "sr-only")}>{state.ok ? state.message : ""}</span>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save work hours"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ToneCard({ initial }: { initial: { tone: string; hasCustom: boolean; previews: boolean } }) {
  const [tone, setTone] = useState(initial.tone);
  const [previews, setPreviews] = useState(initial.previews);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [upState, upload, uploading] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await uploadTone(prev, fd);
    // The server picks the new tone after an upload; follow it.
    if (r.ok) setTone("custom");
    return r;
  }, initialFormState);

  async function save() {
    setSaving(true);
    setNote(null);
    const r = await saveTone(tone);
    if (r.ok) await savePreviews(previews);
    setNote({ ok: r.ok, message: r.message ?? "" });
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sound and previews</CardTitle>
        <CardDescription>
          The sound plays when a notification arrives while QA Hub is open in a tab you&apos;ve clicked in. With QA Hub closed, your device&apos;s own notification sound plays instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4">
          <Field label="Sound" htmlFor="tone">
            <ToneSelect id="tone" value={tone} onChange={setTone} hasCustom={initial.hasCustom} />
          </Field>
          <div className="grid gap-1.5">
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={previews} onChange={(e) => setPreviews(e.target.checked)} className="size-4 accent-acc" />
              Show message previews
            </label>
            <p className="pl-[26px] text-[12.5px] text-muted-foreground">
              The ticket title, the message and the first photo. Turn it off if others can see your screen: you&apos;ll get only &quot;#12 · New reply from Ana&quot;.
            </p>
          </div>
          {note && !note.ok ? <InlineAlert tone="bad" role="alert">{note.message}</InlineAlert> : null}
          <div className="flex items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !note?.ok && "sr-only")}>{note?.ok ? note.message : ""}</span>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <form action={upload} className="grid gap-4 border-t border-line2 pt-5">
          <Field label="Your own sound" htmlFor="toneFile" hint={`MP3 or WAV, at most ${TONE_MAX_SECONDS} seconds and ${TONE_MAX_BYTES / 1024} KB. Only you hear it.`}>
            <Input id="toneFile" name="tone" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" required />
          </Field>
          <FormMessage state={upState} />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[13px] text-muted-foreground", !upState.ok && "sr-only")}>{upState.ok ? upState.message : ""}</span>
            {initial.hasCustom ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await removeTone();
                  if (tone === "custom") setTone(DEFAULT_TONE);
                }}
                disabled={uploading}
              >
                Remove my sound
              </Button>
            ) : null}
            <Button type="submit" disabled={uploading}>{uploading ? "Uploading…" : initial.hasCustom ? "Replace my sound" : "Upload"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
