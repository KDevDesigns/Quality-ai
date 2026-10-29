"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage, FormSection, nativeSelectClass } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { initialFormState, type FormState } from "@/lib/form";
import { PRIORITIES } from "@/lib/schemas/test-case";
import { PRIORITY_LABELS, SEVERITIES, SEVERITY_LABELS, TICKET_TYPES, TYPE_LABELS, type SeverityValue, type TicketType } from "@/lib/tickets/workflow";
import { createTicket, editTicket } from "./actions";
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
};

/**
 * `<form action>` resets every field once the action finishes, even when it failed validation, which would lose a long
 * description and the picked images. Submitting this way keeps what the user typed.
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
    <select id={id} name="areaId" value={value} onChange={(e) => onChange(e.target.value)} className={nativeSelectClass}>
      <option value="">— Not sure —</option>
      {areas.map((m) => (
        <optgroup key={m.id} label={m.name}>
          <option value={m.id}>{m.name} (whole module)</option>
          {m.children.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/** Developers in the chosen area (and its module) first, with the lead marked; everyone else after. */
export function AssigneeSelect({
  areas,
  people,
  areaId,
  defaultValue,
  id = "assigneeId",
}: {
  areas: AreaOption[];
  people: AssigneeOption[];
  areaId: string;
  defaultValue?: string;
  id?: string;
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
    <select id={id} name="assigneeId" defaultValue={defaultValue ?? ""} key={areaId} className={nativeSelectClass}>
      <option value="">— Not assigned yet —</option>
      {inArea.length ? (
        <optgroup label="Works on this module">
          {inArea.map((p) => (
            <option key={p.id} value={p.id}>{label(p)}</option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label={inArea.length ? "Everyone else" : "Developers"}>
        {others.map((p) => (
          <option key={p.id} value={p.id}>{label(p)}</option>
        ))}
      </optgroup>
    </select>
  );
}

/** New ticket (no `ticket`) or edit an existing one. */
export function TicketForm({
  areas,
  people,
  canAssign,
  ticket,
  onDone,
}: {
  areas: AreaOption[];
  people: AssigneeOption[];
  canAssign: boolean;
  ticket?: TicketValues;
  onDone?: () => void;
}) {
  const images = useImageAttachments();
  const video = useVideoUpload();
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = ticket ? await editTicket(prev, fd) : await createTicket(prev, fd);
    if (r.ok) onDone?.();
    return r;
  }, initialFormState);
  const err = state.fieldErrors ?? {};
  const [type, setType] = useState<TicketType>(ticket?.type ?? "BUG");
  const [areaId, setAreaId] = useState(ticket?.areaId ?? "");

  return (
    <form onSubmit={submitKeepingInput(action)} className="@container grid gap-5">
      {ticket ? (
        <>
          <input type="hidden" name="id" value={ticket.id} />
          <input type="hidden" name="number" value={ticket.number} />
        </>
      ) : null}

      {/* Wide screens: what happened on the left, the details beside it. In the edit dialog it stays one column. */}
      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] @4xl:items-start @4xl:gap-8">
        <div className="grid min-w-0 gap-5">
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">What is it?</legend>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {TICKET_TYPES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-line p-3 text-sm transition-colors hover:border-acc-b has-checked:border-acc has-checked:bg-acc-t2"
                >
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="mt-0.5 size-4 accent-acc" />
                  <span>
                    <span className="block font-medium">{TYPE_LABELS[t]}</span>
                    <span className="text-[12.5px] text-muted-foreground">{TYPE_HINTS[t]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Title" htmlFor="title" error={err.title} required hint="One line someone can understand from the list, e.g. “Senior citizen discount not applied on bill reprint”.">
            <Input id="title" name="title" defaultValue={ticket?.title} required minLength={5} maxLength={150} aria-invalid={!!err.title} />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            error={err.description}
            required
            hint={type === "BUG" ? "Steps to reproduce, what you expected, and what happened instead. Use QA- test accounts where you can." : "What you'd like and why it helps."}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={ticket?.description}
              required
              maxLength={20000}
              rows={8}
              className="min-h-40"
              onPaste={ticket ? undefined : images.onPaste}
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
        <div className="grid gap-5 @4xl:sticky @4xl:top-20 @4xl:rounded-[12px] @4xl:border @4xl:border-line @4xl:bg-surface2 @4xl:p-5">
          <FormSection>Details</FormSection>
          <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-1">
            <Field label="Module" htmlFor="areaId" error={err.areaId} hint="Where in the ERP. It decides who is suggested below.">
              <AreaSelect areas={areas} value={areaId} onChange={setAreaId} />
            </Field>
            <Field label="Found in" htmlFor="foundIn" error={err.foundIn} hint="Optional: ERP build, server or page.">
              <Input id="foundIn" name="foundIn" defaultValue={ticket?.foundIn ?? ""} maxLength={100} placeholder="e.g. staging, build 2026.10.2" />
            </Field>
            {type === "BUG" ? (
              <Field label="Severity" htmlFor="severity" error={err.severity} hint="How bad the effect is: S1 blocks work or gets money wrong.">
                <select id="severity" name="severity" defaultValue={ticket?.severity ?? "S3"} className={nativeSelectClass}>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Priority" htmlFor="priority" error={err.priority} hint="How soon it should be looked at.">
              <select id="priority" name="priority" defaultValue={ticket?.priority ?? "P3"} className={nativeSelectClass}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </Field>
            {!ticket && canAssign ? (
              <Field label="Developer" htmlFor="assigneeId" error={err.assigneeId} hint="Who should fix it. You can change it later.">
                <AssigneeSelect areas={areas} people={people} areaId={areaId} />
              </Field>
            ) : null}
          </div>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2 @4xl:grid">
            <Button type="submit" disabled={pending || video.busy} size="lg">
              {video.busy ? "Uploading video…" : pending ? (images.files.length ? "Uploading…" : "Saving…") : ticket ? "Save changes" : "File ticket"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
