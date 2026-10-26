"use client";

import { useActionState, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { riskBand, SCALE } from "@/lib/risk/score";
import { ISO25010_CHARACTERISTICS } from "@/lib/schemas/risk";
import { RiskScoreBadge } from "./risk-score-badge";
import { saveRisk } from "./actions";

export type RiskValues = {
  id: string;
  moduleId: string;
  processId: string | null;
  title: string;
  characteristic: string;
  likelihood: number;
  impact: number;
  mitigation: string | null;
};

type Option = { id: string; name: string };
type ProcessOption = Option & { moduleId: string };

const LIKELIHOOD = ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"];
const IMPACT = ["Negligible", "Minor", "Moderate", "Major", "Severe"];

export function RiskDialog({ risk, modules, processes }: { risk?: RiskValues; modules: Option[]; processes: ProcessOption[] }) {
  return (
    <FormDialog
      wide
      title={risk ? "Edit risk" : "New risk"}
      description="Score = likelihood × impact. The score drives test priority."
      trigger={
        risk ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${risk.title}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button disabled={modules.length === 0}>
            <PlusIcon /> New risk
          </Button>
        )
      }
    >
      {(close) => <RiskForm risk={risk} modules={modules} processes={processes} onDone={close} />}
    </FormDialog>
  );
}

function RiskForm({ risk, modules, processes, onDone }: { risk?: RiskValues; modules: Option[]; processes: ProcessOption[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveRisk(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);
  const [moduleId, setModuleId] = useState(risk?.moduleId ?? modules[0]?.id ?? "");
  const [processId, setProcessId] = useState(risk?.processId ?? "");
  const [likelihood, setLikelihood] = useState(risk?.likelihood ?? 3);
  const [impact, setImpact] = useState(risk?.impact ?? 3);
  const moduleProcesses = processes.filter((p) => p.moduleId === moduleId);
  const err = state.fieldErrors ?? {};
  const score = likelihood * impact;

  return (
    <form action={action} className="grid gap-4">
      {risk ? <input type="hidden" name="id" value={risk.id} /> : null}
      <Field label="Title" htmlFor="title" error={err.title}>
        <Input id="title" name="title" defaultValue={risk?.title} required maxLength={200} aria-invalid={!!err.title} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Module" htmlFor="moduleId" error={err.moduleId}>
          <select
            id="moduleId"
            name="moduleId"
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setProcessId("");
            }}
            className={nativeSelectClass}
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Process (optional)" htmlFor="processId" error={err.processId}>
          <select id="processId" name="processId" value={processId} onChange={(e) => setProcessId(e.target.value)} className={nativeSelectClass}>
            <option value="">Not process-specific</option>
            {moduleProcesses.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="ISO/IEC 25010 characteristic" htmlFor="characteristic" error={err.characteristic}>
        <select id="characteristic" name="characteristic" defaultValue={risk?.characteristic ?? ISO25010_CHARACTERISTICS[0]} className={nativeSelectClass}>
          {ISO25010_CHARACTERISTICS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Likelihood" htmlFor="likelihood" error={err.likelihood}>
          <select id="likelihood" name="likelihood" value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))} className={nativeSelectClass}>
            {SCALE.map((v) => (
              <option key={v} value={v}>{v} · {LIKELIHOOD[v - 1]}</option>
            ))}
          </select>
        </Field>
        <Field label="Impact" htmlFor="impact" error={err.impact}>
          <select id="impact" name="impact" value={impact} onChange={(e) => setImpact(Number(e.target.value))} className={nativeSelectClass}>
            {SCALE.map((v) => (
              <option key={v} value={v}>{v} · {IMPACT[v - 1]}</option>
            ))}
          </select>
        </Field>
        <div className="flex h-8 items-center gap-2 text-sm" aria-live="polite">
          Score <RiskScoreBadge score={score} band={riskBand(score)} />
        </div>
      </div>
      <Field label="Mitigation" htmlFor="mitigation" error={err.mitigation}>
        <Textarea id="mitigation" name="mitigation" defaultValue={risk?.mitigation ?? ""} rows={2} placeholder="Which tests, oracles or recon checks cover this risk" />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
