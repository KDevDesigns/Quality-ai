"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage, FormSection } from "@/components/form-field";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { initialFormState, type FormState } from "@/lib/form";
import { PRIORITIES, PRIORITY_LABELS, SEVERITIES, SEVERITY_LABELS, TICKET_TYPES, TYPE_LABELS, type SeverityValue, type TicketType } from "@/lib/tickets/workflow";
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
};

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
                    "flex cursor-pointer items-start gap-2.5 rounded-[0.625rem] border border-line p-3 text-sm transition-[border-color,background-color,transform] duration-200 active:scale-[0.99] has-focus-visible:ring-3 has-focus-visible:ring-acc/25 max-md:flex-col max-md:items-center max-md:gap-1.5 max-md:rounded-xl max-md:border-[0.125rem] max-md:px-2 max-md:py-3 max-md:text-center max-md:has-checked:font-semibold",
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
              <Input id="foundIn" name="foundIn" defaultValue={ticket?.foundIn ?? ""} maxLength={100} placeholder="e.g. staging, build 2026.10.2" />
            </Field>
            {type === "BUG" ? (
              <Field label="Severity" htmlFor="severity" error={err.severity} hint="How bad the effect is: S1 blocks work or gets money wrong.">
                <SelectField id="severity" name="severity" defaultValue={ticket?.severity ?? "S3"} options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))} />
              </Field>
            ) : null}
            <Field label="Priority" htmlFor="priority" error={err.priority} hint="How soon it should be looked at.">
              <SelectField id="priority" name="priority" defaultValue={ticket?.priority ?? "P3"} options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))} />
            </Field>
            {!ticket && canAssign ? (
              <Field label="Developer" htmlFor="assigneeId" error={err.assigneeId} hint="Who should fix it. You can change it later.">
                <AssigneeSelect areas={areas} people={people} areaId={areaId} />
              </Field>
            ) : null}
          </div>
          <FormMessage state={state} />
          {/* Phones: the main button stays at the bottom of the screen, full width, clear of the home bar. */}
          <div className="flex justify-end gap-2 @4xl:grid max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-5 max-md:-mb-5 max-md:border-t max-md:border-line2 max-md:bg-card/90 max-md:px-5 max-md:pt-3 max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-md:backdrop-blur-xl">
            <Button type="submit" disabled={pending || video.busy || images.busy} size="lg" className="max-md:h-12 max-md:w-full max-md:rounded-[0.875rem] max-md:text-base">

              {video.busy ? "Uploading video…" : images.busy ? "Uploading…" : pending ? "Saving…" : ticket ? "Save changes" : "File ticket"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
