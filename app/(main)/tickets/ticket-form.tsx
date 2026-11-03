"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Field, FormMessage, FormSection } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { initialFormState, type FormState } from "@/lib/form";
import { DRAFT_FIELDS, draftKey, FILING_KEY, guessDevice, isDeviceType, isEmptyDraft, parseDraft, type DraftFile, type TicketDraft } from "@/lib/tickets/draft";
import { DEVICE_LABELS, DEVICE_TYPES, PRIORITIES, PRIORITY_LABELS, SEVERITIES, SEVERITY_LABELS, TICKET_TYPES, TYPE_LABELS, type DeviceType, type SeverityValue, type TicketType } from "@/lib/tickets/workflow";
import { cn } from "@/lib/utils";
import { createTicket, editTicket } from "./actions";
import { TYPE_ICON, typeStyle } from "./ticket-bits";
import { ImagePicker, useImageAttachments } from "./image-picker";
import { useVideoUpload, VideoPicker } from "./video-picker";

export type AreaOption = { id: string; name: string; children: { id: string; name: string }[] };
/** A developer or admin, with the areas they belong to, so the picker can suggest the right people. */
export type AssigneeOption = { id: string; name: string; role: Role; areaIds: string[]; leadAreaIds: string[] };

export type TicketValues = {
  id: string;
  number: number;
  type: TicketType;
  title: string;
  description: string;
  areaId: string | null;
  severity: SeverityValue | null;
  priority: (typeof PRIORITIES)[number];
  foundIn: string | null;
  deviceType: DeviceType | null;
};

/** The last Device type chosen in this browser. */
const DEVICE_KEY = "qa-hub:device-type";

/** Browser storage can be unavailable (private windows); a draft or remembered choice is only a convenience. */
function storage(run: (s: Storage) => void) {
  try {
    run(localStorage);
  } catch {
    // Nothing to do: the form still works, it just won't remember.
  }
}

/**
 * `<form action>` resets every field once the action finishes, even when it failed validation, which would lose a long
 * description and the uploaded files' ids. Submitting this way keeps what the user typed.
 */
export function submitKeepingInput(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

const TYPE_HINTS: Record<TicketType, string> = {
  BUG: "Something in the ERP is wrong or broken.",
  SUGGESTION: "An idea for something new.",
  IMPROVEMENT: "Something that works but could be better.",
};

export function AreaSelect({ areas, value, onChange, id = "areaId" }: { areas: AreaOption[]; value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <SelectField
      id={id}
      name="areaId"
      value={value}
      onValueChange={onChange}
      groups={[
        { options: [{ value: "", label: "— Not sure —" }] },
        ...areas.map((m) => ({
          label: m.name,
          options: [{ value: m.id, label: `${m.name} (whole module)` }, ...m.children.map((c) => ({ value: c.id, label: c.name }))],
        })),
      ]}
    />
  );
}

/** Developers in the chosen area (and its module) first, with the lead marked; everyone else after. */
export function AssigneeSelect({
  areas,
  people,
  areaId,
  defaultValue,
  id = "assigneeId",
  onValueChange,
}: {
  areas: AreaOption[];
  people: AssigneeOption[];
  areaId: string;
  defaultValue?: string;
  id?: string;
  onValueChange?: (assigneeId: string) => void;
}) {
  const parent = areas.find((m) => m.id === areaId || m.children.some((c) => c.id === areaId));
  const scope = areaId ? [areaId, ...(parent && parent.id !== areaId ? [parent.id] : [])] : [];
  const inArea = people
    .filter((p) => p.areaIds.some((a) => scope.includes(a)))
    .sort((a, b) => Number(b.leadAreaIds.some((x) => scope.includes(x))) - Number(a.leadAreaIds.some((x) => scope.includes(x))));
  const others = people.filter((p) => !inArea.includes(p));
  const label = (p: AssigneeOption) =>
    `${p.name}${p.leadAreaIds.some((x) => scope.includes(x)) ? " · lead" : ""}${p.role === "ADMIN" ? ` · ${ROLE_LABELS.ADMIN}` : ""}`;

  return (
    <SelectField
      key={areaId}
      id={id}
      name="assigneeId"
      defaultValue={defaultValue ?? ""}
      onValueChange={onValueChange}
      groups={[
        { options: [{ value: "", label: "— Not assigned yet —" }] },
        ...(inArea.length ? [{ label: "Works on this module", options: inArea.map((p) => ({ value: p.id, label: label(p) })) }] : []),
        { label: inArea.length ? "Everyone else" : "Developers", options: others.map((p) => ({ value: p.id, label: label(p) })) },
      ]}
    />
  );
}

type TicketFormProps = {
  areas: AreaOption[];
  people: AssigneeOption[];
  canAssign: boolean;
  ticket?: TicketValues;
  onDone?: () => void;
  /** New ticket only: whose draft to keep in this browser (lib/tickets/draft.ts). */
  draftUserId?: string;
};

/** New ticket (no `ticket`) or edit an existing one. */
export function TicketForm(props: TicketFormProps) {
  const { ticket, draftUserId } = props;
  // Browser storage only exists after hydration, so a draft fills the form by starting it again with those values.
  const [restored, setRestored] = useState<{ run: number; draft: TicketDraft | null }>({ run: 0, draft: null });
  const [defaultDevice, setDefaultDevice] = useState<DeviceType | "">("");
  const loaded = useRef(false);
  const sent = useRef(false);

  useEffect(() => {
    if (ticket) return;
    queueMicrotask(() => {
      // Next keeps a page's state when you move away and runs this again on the way back. Open work stays as it is,
      // unless it was filed meanwhile (its draft is gone): then this is a new ticket, not the old one again.
      if (loaded.current) {
        let waiting = false;
        storage((s) => {
          waiting = !!draftUserId && !!s.getItem(draftKey(draftUserId));
        });
        if (sent.current && !waiting) {
          sent.current = false;
          setRestored((r) => ({ run: r.run + 1, draft: null }));
        }
        return;
      }
      loaded.current = true;
      let remembered: string | null = null;
      storage((s) => {
        remembered = s.getItem(DEVICE_KEY);
        if (!draftUserId) return;
        const raw = s.getItem(draftKey(draftUserId));
        const draft = parseDraft(raw, Date.now());
        if (draft) setRestored({ run: 1, draft });
        // Too old to use: nothing typed stays on the phone any longer.
        else if (raw) s.removeItem(draftKey(draftUserId));
      });
      setDefaultDevice(isDeviceType(remembered) ? remembered : guessDevice(navigator.userAgent, navigator.maxTouchPoints));
    });
  }, [ticket, draftUserId]);

  function clearDraft() {
    if (draftUserId) storage((s) => s.removeItem(draftKey(draftUserId)));
    setRestored((r) => ({ run: r.run + 1, draft: null }));
  }

  return <TicketFormFields key={restored.run} {...props} restored={restored.draft} defaultDevice={defaultDevice} onClearDraft={clearDraft} onSending={(sending) => (sent.current = sending)} />;
}

function TicketFormFields({
  areas,
  people,
  canAssign,
  ticket,
  onDone,
  draftUserId,
  restored,
  defaultDevice,
  onClearDraft,
  onSending,
}: TicketFormProps & { restored: TicketDraft | null; defaultDevice: DeviceType | ""; onClearDraft: () => void; onSending: (sending: boolean) => void }) {
  const images = useImageAttachments(restored?.files.filter((f) => f.kind === "IMAGE"));
  const video = useVideoUpload(restored?.files.find((f) => f.kind === "VIDEO"));
  const form = useRef<HTMLFormElement>(null);
  const typing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Keeps the draft: a moment after typing, when files change, and when a phone hides or unloads the page.
  const save = useRef(() => {});
  // While a ticket is being sent, so a late save can't write it back. The draft itself goes only when the ticket page
  // confirms it was filed (filed-reminder.tsx): anything else, like a dropped signal, must keep it.
  const filing = useRef(false);
  const uploadTimes = useRef(new Map(restored?.files.map((f) => [f.id, f.uploadedAt]) ?? []));
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    filing.current = true;
    clearTimeout(typing.current);
    onSending(true);
    const device = fd.get("deviceType");
    if (!ticket && typeof device === "string" && device) storage((s) => s.setItem(DEVICE_KEY, device));
    if (!ticket) {
      const mark = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      fd.set("filing", mark);
      try {
        sessionStorage.setItem(FILING_KEY, mark);
      } catch {
        // No storage, no draft to delete either.
      }
    }
    // Not filed: the form stays as it is, and is saved in case the phone unloads it now.
    const notSent = () => {
      filing.current = false;
      onSending(false);
      save.current();
    };
    try {
      const r = ticket ? await editTicket(prev, fd) : await createTicket(prev, fd);
      if (r.ok) onDone?.();
      else notSent();
      return r;
    } catch (e) {
      // Next's redirect after filing, and server errors, carry a digest and go on as usual.
      if (e && typeof e === "object" && "digest" in e) throw e;
      // No answer: a dropped signal, or the answer was lost after the server acted, so it may have gone through.
      notSent();
      return { ok: false, message: "This may not have gone through. Check your connection, and check Tickets before trying again. Nothing you added is lost." };
    }
  }, initialFormState);
  const err = state.fieldErrors ?? {};
  const d = restored?.fields;
  const [type, setType] = useState<TicketType>(ticket?.type ?? (d?.type as TicketType | undefined) ?? "BUG");
  const [areaId, setAreaId] = useState(ticket?.areaId ?? d?.areaId ?? "");
  const [device, setDevice] = useState<string | null>(ticket ? (ticket.deviceType ?? "") : (d?.deviceType ?? null));

  const savedFiles = useRef<string | null>(null);
  useEffect(() => {
    save.current = () => {
      if (!draftUserId || filing.current || !form.current) return;
      const fd = new FormData(form.current);
      const fields: Record<string, string> = {};
      for (const k of DRAFT_FIELDS) {
        const v = fd.get(k);
        if (typeof v === "string") fields[k] = v;
      }
      const uploadedAt = (id: string) => {
        if (!uploadTimes.current.has(id)) uploadTimes.current.set(id, Date.now());
        return uploadTimes.current.get(id)!;
      };
      const files: DraftFile[] = images.items.flatMap((i) => (i.id ? [{ id: i.id, kind: "IMAGE" as const, name: i.name, size: i.size, durationSec: null, uploadedAt: uploadedAt(i.id) }] : []));
      if (video.upload.status === "done") {
        const { id, name, size, durationSec } = video.upload;
        files.push({ id, kind: "VIDEO", name, size, durationSec, uploadedAt: uploadedAt(id) });
      }
      const key = draftKey(draftUserId);
      storage((s) => (isEmptyDraft({ fields, files }) ? s.removeItem(key) : s.setItem(key, JSON.stringify({ savedAt: Date.now(), fields, files }))));
    };
    // Only when a file really came or went: on opening, the still-empty form must not overwrite a draft waiting to load.
    const uploaded = [...images.items.map((i) => i.id), video.upload.status === "done" ? video.upload.id : null].filter(Boolean).join();
    if (savedFiles.current !== null && savedFiles.current !== uploaded) save.current();
    savedFiles.current = uploaded;
  }, [draftUserId, images.items, video.upload]);

  useEffect(() => {
    if (!draftUserId) return;
    const onHide = () => document.visibilityState === "hidden" && save.current();
    const onLeave = () => save.current();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [draftUserId]);

  const saveSoon = () => {
    clearTimeout(typing.current);
    typing.current = setTimeout(() => save.current(), 500);
  };

  return (
    <form ref={form} onSubmit={submitKeepingInput(action)} onInput={saveSoon} className="@container grid gap-5">
      {restored ? (
        <InlineAlert tone="info" role="status">
          <div className="grid justify-items-start gap-2">
            <span>Draft restored. Files that hadn&apos;t finished uploading need adding again.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Everything goes, including what was added since: the server deletes the uploads and any still running stops.
                images.items.forEach((i) => images.remove(i.key));
                video.cancel();
                video.remove();
                onClearDraft();
              }}
            >
              Clear
            </Button>
          </div>
        </InlineAlert>
      ) : null}
      {ticket ? (
        <>
          <input type="hidden" name="id" value={ticket.id} />
          <input type="hidden" name="number" value={ticket.number} />
        </>
      ) : null}

      {/* Wide screens: what happened on the left, the details beside it. In the edit dialog it stays one column. */}
      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(17.5rem,21.25rem)] @4xl:items-start @4xl:gap-8">
        <div className="grid min-w-0 gap-5">
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">What is it?</legend>
            {/* Phones: three compact buttons side by side (icon over name); the picked one is outlined and bold. */}
            <div className="grid grid-cols-3 gap-2.5">
              {TICKET_TYPES.map((t) => {
                const Icon = TYPE_ICON[t];
                return (
                <label
                  key={t}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-[0.625rem] border border-line p-3 text-sm transition-[border-color,background-color,transform] duration-200 active:scale-[0.99] has-focus-visible:ring-3 has-focus-visible:ring-acc/25 max-md:flex-col max-md:items-center max-md:gap-1.5 max-md:rounded-xl max-md:border-[0.125rem] max-md:px-1 max-md:py-3 max-md:text-center max-md:has-checked:font-semibold",
                    typeStyle(t).choice,
                  )}
                >
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="mt-0.5 max-md:sr-only" />
                  <span className="max-md:contents">
                    <span className="flex items-center gap-1.5 font-medium max-md:flex-col max-md:gap-1.5">
                      <Icon className={cn("size-4 max-md:size-6", typeStyle(t).icon)} aria-hidden />
                      {TYPE_LABELS[t]}
                    </span>
                    <span className="text-[0.7813rem] text-muted-foreground max-md:hidden">{TYPE_HINTS[t]}</span>
                  </span>
                </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Title" htmlFor="title" error={err.title} required hint="One line someone can understand from the list, e.g. “Senior citizen discount not applied on bill reprint”.">
            <Input id="title" name="title" defaultValue={ticket?.title ?? d?.title} required minLength={5} maxLength={150} aria-invalid={!!err.title} />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            error={err.description}
            hint={type === "BUG" ? "Steps to reproduce, what you expected, and what happened instead. Use QA- test accounts where you can." : "What you'd like and why it helps."}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={ticket?.description ?? d?.description}
              maxLength={20000}
              rows={8}
              className="min-h-40"
              aria-invalid={!!err.description}
              placeholder={type === "BUG" ? "1. Open …\n2. Click …\n\nExpected: …\nActual: …" : undefined}
            />
          </Field>

          {!ticket ? (
            <Field label="Screenshots" htmlFor="images" error={err.images}>
              <ImagePicker state={images} />
            </Field>
          ) : null}
          {!ticket ? (
            <Field label="Video" htmlFor="video">
              <VideoPicker state={video} />
            </Field>
          ) : null}
        </div>
        <div className="grid gap-5 @4xl:sticky @4xl:top-20 @4xl:rounded-[0.75rem] @4xl:border @4xl:border-line @4xl:bg-surface2 @4xl:p-5">
          <FormSection>Details</FormSection>
          <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-1">
            <Field label="Module" htmlFor="areaId" error={err.areaId} hint="Where in the ERP. It decides who is suggested below.">
              <AreaSelect areas={areas} value={areaId} onChange={setAreaId} />
            </Field>
            <Field label="Found in" htmlFor="foundIn" error={err.foundIn} hint="Optional: ERP build, server or page.">
              <Input id="foundIn" name="foundIn" defaultValue={ticket?.foundIn ?? d?.foundIn ?? ""} maxLength={100} placeholder="e.g. staging, build 2026.10.2" />
            </Field>
            {type === "BUG" ? (
              <Field label="Severity" htmlFor="severity" error={err.severity} hint="How bad the effect is: S1 blocks work or gets money wrong.">
                <SelectField id="severity" name="severity" defaultValue={ticket?.severity ?? d?.severity ?? "S3"} options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))} />
              </Field>
            ) : null}
            {type === "BUG" ? (
              <Field label="Device type" htmlFor="deviceType" error={err.deviceType} hint="What the bug happened on.">
                <SelectField
                  id="deviceType"
                  name="deviceType"
                  value={device ?? defaultDevice}
                  onValueChange={setDevice}
                  options={[{ value: "", label: "— Not set —" }, ...DEVICE_TYPES.map((t) => ({ value: t, label: DEVICE_LABELS[t] }))]}
                />
              </Field>
            ) : null}
            <Field label="Priority" htmlFor="priority" error={err.priority} hint="How soon it should be looked at.">
              <SelectField id="priority" name="priority" defaultValue={ticket?.priority ?? d?.priority ?? "P3"} options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))} />
            </Field>
            {!ticket && canAssign ? (
              <Field label="Developer" htmlFor="assigneeId" error={err.assigneeId} hint="Who should fix it. You can change it later.">
                <AssigneeSelect areas={areas} people={people} areaId={areaId} defaultValue={d?.assigneeId} />
              </Field>
            ) : null}
          </div>
          <FormMessage state={state} />
          {/* Phones: the main button stays at the bottom of the screen, full width, clear of the home bar. */}
          <div className="flex justify-end gap-2 @4xl:grid max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-5 max-md:-mb-5 max-md:border-t max-md:border-line2 max-md:bg-card/90 max-md:px-5 max-md:pt-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-md:backdrop-blur-xl">
            <Button type="submit" disabled={pending || video.busy || images.busy || images.failed || video.blocked} size="lg" className="max-md:h-12 max-md:w-full max-md:rounded-[0.875rem] max-md:text-base">

              {video.busy ? "Uploading video…" : images.busy ? "Uploading…" : images.failed || video.blocked ? "Finish the files above" : pending ? "Saving…" : ticket ? "Save changes" : "File ticket"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
