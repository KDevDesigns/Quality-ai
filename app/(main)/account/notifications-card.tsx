"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, FormMessage } from "@/components/form-field";
import { SelectField } from "@/components/select-field";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initialFormState } from "@/lib/form";
import type { OffHoursPush } from "@/lib/schemas/push";
import { ampm, hhmm, timeOptions } from "@/lib/time-options";
import { cn } from "@/lib/utils";
import { savePreviews, saveTone, saveWorkHours, sendTestPush } from "./actions";
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
            <span aria-live="polite" className={cn("text-[0.8125rem] text-muted-foreground", !note?.ok && "sr-only")}>{note?.ok ? note.message : ""}</span>
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

const OFF_HOURS: { value: OffHoursPush; label: string; hint: string }[] = [
  { value: "SOUND", label: "Notify me with sound", hint: "The same as during work hours." },
  { value: "SILENT", label: "Notify me silently", hint: "No sound or vibration; it waits in your notification list. iPhones still play their sound." },
  { value: "NONE", label: "Don't notify me", hint: "Nothing on your devices. You'll see it in the bell and My inbox." },
];

export function WorkHoursCard({ initial }: { initial: { offHoursPush: OffHoursPush; workStartMin: number; workEndMin: number; workDays: number } }) {
  const [state, action, pending] = useActionState(saveWorkHours, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work hours</CardTitle>
        <CardDescription>Choose what your devices do outside these hours and days. Everything still shows in the bell and My inbox. Philippine time.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="workStart" error={err.workStartMin}>
              <SelectField id="workStart" name="workStart" required defaultValue={hhmm(initial.workStartMin)} options={timeOptions(30, initial.workStartMin)} aria-invalid={!!err.workStartMin} />
            </Field>
            <Field label="To" htmlFor="workEnd" error={err.workEndMin}>
              <SelectField id="workEnd" name="workEnd" required defaultValue={hhmm(initial.workEndMin)} options={timeOptions(30, initial.workEndMin)} aria-invalid={!!err.workEndMin} />
            </Field>
          </div>
          {initial.workEndMin <= initial.workStartMin ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              Saved: {ampm(initial.workStartMin)} to {ampm(initial.workEndMin)} the next day.
            </p>
          ) : null}
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Days</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {DAYS.map((d, i) => (
                <label key={d} className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" name="days" value={i} defaultChecked={!!(initial.workDays & (1 << i))} />
                  {d}
                </label>
              ))}
            </div>
            {err.days?.length ? <p className="text-[0.7813rem] font-medium text-destructive">{err.days.join(" ")}</p> : null}
          </fieldset>
          <fieldset className="grid gap-2.5">
            <legend className="mb-2 text-sm font-medium">Outside my work hours and days</legend>
            {OFF_HOURS.map((o) => (
              <label key={o.value} className="grid grid-cols-[auto_1fr] items-baseline gap-x-2.5 text-sm">
                <input type="radio" name="offHoursPush" value={o.value} defaultChecked={initial.offHoursPush === o.value} />
                {o.label}
                <span className="col-start-2 text-[0.7813rem] text-muted-foreground">{o.hint}</span>
              </label>
            ))}
            {err.offHoursPush?.length ? <p className="text-[0.7813rem] font-medium text-destructive">{err.offHoursPush.join(" ")}</p> : null}
          </fieldset>
          <FormMessage state={state} />
          <div className="flex items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[0.8125rem] text-muted-foreground", !state.ok && "sr-only")}>{state.ok ? state.message : ""}</span>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save work hours"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ToneCard({ initial }: { initial: { tone: string; previews: boolean } }) {
  const [tone, setTone] = useState(initial.tone);
  const [previews, setPreviews] = useState(initial.previews);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

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
      <CardContent>
        <div className="grid gap-4">
          <Field label="Sound" htmlFor="tone">
            <ToneSelect id="tone" value={tone} onChange={setTone} />
          </Field>
          <div className="grid gap-1.5">
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={previews} onChange={(e) => setPreviews(e.target.checked)} />
              Show message previews
            </label>
            <p className="pl-[1.625rem] text-[0.7813rem] text-muted-foreground">
              The ticket title and the message. Turn it off if others can see your screen: you&apos;ll get only &quot;#12 · New reply from Ana&quot;.
            </p>
          </div>
          {note && !note.ok ? <InlineAlert tone="bad" role="alert">{note.message}</InlineAlert> : null}
          <div className="flex items-center justify-end gap-3">
            <span aria-live="polite" className={cn("text-[0.8125rem] text-muted-foreground", !note?.ok && "sr-only")}>{note?.ok ? note.message : ""}</span>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
