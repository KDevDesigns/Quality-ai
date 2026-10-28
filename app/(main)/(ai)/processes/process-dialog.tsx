"use client";

import { useActionState, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { MODULE_CODES, type ModuleCodeValue } from "@/lib/schemas/common";
import type { ProcessStep } from "@/lib/schemas/process";
import { saveProcess } from "./actions";

export type ProcessValues = {
  id: string;
  moduleId: string;
  name: string;
  description: string | null;
  steps: ProcessStep[];
};

type ModuleOption = { id: string; code: ModuleCodeValue; name: string };
type DraftStep = { key: number; name: string; module: ModuleCodeValue | ""; handoff: boolean };

export function ProcessDialog({ process, modules }: { process?: ProcessValues; modules: ModuleOption[] }) {
  return (
    <FormDialog
      wide
      title={process ? `Edit ${process.name}` : "New business process"}
      description="Steps run in order. Mark hand-offs to another module: those are where the process suites will assert ledger state."
      trigger={
        process ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${process.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button disabled={modules.length === 0}>
            <PlusIcon /> New process
          </Button>
        )
      }
    >
      {(close) => <ProcessForm process={process} modules={modules} onDone={close} />}
    </FormDialog>
  );
}

function ProcessForm({ process, modules, onDone }: { process?: ProcessValues; modules: ModuleOption[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveProcess(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);

  const [nextKey, setNextKey] = useState(process?.steps.length ?? 1);
  const [steps, setSteps] = useState<DraftStep[]>(() =>
    process?.steps.length
      ? process.steps.map((s, i) => ({ key: i, name: s.name, module: s.module ?? "", handoff: s.handoff }))
      : [{ key: 0, name: "", module: "", handoff: false }],
  );

  const update = (key: number, patch: Partial<DraftStep>) =>
    setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (index: number, delta: number) =>
    setSteps((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  const add = () => {
    setSteps((list) => [...list, { key: nextKey, name: "", module: "", handoff: false }]);
    setNextKey((k) => k + 1);
  };

  const payload = JSON.stringify(steps.map(({ name, module, handoff }) => ({ name, module: module || null, handoff })));
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      {process ? <input type="hidden" name="id" value={process.id} /> : null}
      <input type="hidden" name="steps" value={payload} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Owning module" htmlFor="moduleId" error={err.moduleId}>
          <select id="moduleId" name="moduleId" defaultValue={process?.moduleId ?? modules[0]?.id} className={nativeSelectClass} required>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Name" htmlFor="name" error={err.name}>
          <Input id="name" name="name" defaultValue={process?.name} placeholder="Meter-to-Cash" required maxLength={100} aria-invalid={!!err.name} />
        </Field>
      </div>
      <Field label="Description" htmlFor="description" error={err.description}>
        <Textarea id="description" name="description" defaultValue={process?.description ?? ""} rows={2} />
      </Field>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-[14.5px] font-medium">Steps</legend>
        <ol className="grid gap-2">
          {steps.map((s, i) => (
            <li key={s.key} className="grid grid-cols-[1.75rem_1fr] items-center gap-2 rounded-xl border border-line bg-surface2 p-2.5 sm:grid-cols-[1.75rem_1fr_8.5rem_auto_auto]">
              <span className="flex size-[26px] items-center justify-center rounded-full bg-acc-t font-mono text-xs font-semibold text-acc-ink" aria-hidden>{i + 1}</span>
              <Input
                aria-label={`Step ${i + 1} name`}
                value={s.name}
                onChange={(e) => update(s.key, { name: e.target.value })}
                placeholder="What happens in this step"
              />
              <select
                aria-label={`Step ${i + 1} module`}
                value={s.module}
                onChange={(e) => update(s.key, { module: e.target.value as DraftStep["module"] })}
                className={`${nativeSelectClass} col-start-2 sm:col-start-auto`}
              >
                <option value="">Same module</option>
                {MODULE_CODES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="col-start-2 flex h-11 items-center gap-2 text-[13.5px] font-medium text-ink2 sm:col-start-auto">
                <input type="checkbox" checked={s.handoff} onChange={(e) => update(s.key, { handoff: e.target.checked })} className="size-[18px] accent-acc" />
                Hand-off
              </label>
              <div className="col-start-2 flex sm:col-start-auto">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUpIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move step ${i + 1} down`} disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDownIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove step ${i + 1}`} disabled={steps.length === 1} onClick={() => setSteps((l) => l.filter((x) => x.key !== s.key))}>
                  <XIcon />
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={add}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-acc-b bg-acc-t2 text-[15px] font-medium text-acc transition-colors hover:bg-acc-t focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none"
        >
          <PlusIcon className="size-4" aria-hidden /> Add step
        </button>
        {err.steps?.length ? <p className="text-xs text-destructive">{err.steps.join(" ")} Every step needs a name.</p> : null}
      </fieldset>

      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
