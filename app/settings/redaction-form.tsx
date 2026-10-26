"use client";

import { useActionState, useState, useTransition } from "react";
import { EyeOffIcon } from "lucide-react";
import { Field } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/form";
import { previewRedaction, saveRedaction, type RedactionPreview } from "./actions";

type Props = {
  names: string[];
  patterns: { label: string; pattern: string }[];
  llmSecondPass: boolean;
  amounts: boolean;
};

const SAMPLE =
  "Customer Juan Dela Cruz (Account No. 01-2345-678) disputes OR No. 0098812 for ₱3,450.75. Call 0917 555 1234 or juan.dc@gmail.com. Meter No. MX445566.";

export function RedactionForm(props: Props) {
  const [state, action, pending] = useActionState(saveRedaction, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form action={action} className="grid content-start gap-4">
        <Field label="Names to mask" htmlFor="names" error={err.redaction ?? err.names} hint="One person per line. Matches “Surname, Given”, any letter case, and ñ written as n.">
          <Textarea id="names" name="names" rows={6} defaultValue={props.names.join("\n")} placeholder={"Juan Dela Cruz\nMa. Cristina Santos-Ibañez"} />
        </Field>
        <Field
          label="Extra ID formats"
          htmlFor="patterns"
          error={err.patterns}
          hint={<>One per line as <code className="font-mono">LABEL = regex</code>, e.g. <code className="font-mono">ACCT = \b\d{"{2}"}-\d{"{3}"}-\d{"{4}"}-\d\b</code></>}
        >
          <Textarea
            id="patterns"
            name="patterns"
            rows={3}
            className="font-mono text-[13px]"
            defaultValue={props.patterns.map((p) => `${p.label} = ${p.pattern}`).join("\n")}
          />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line p-3.5 text-sm hover:border-acc-b">
          <input type="checkbox" name="amounts" defaultChecked={props.amounts} className="mt-0.5 size-[18px] accent-acc" />
          <span>
            <span className="font-semibold">Mask peso amounts</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">Amounts tied to a person count as sensitive.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line p-3.5 text-sm hover:border-acc-b">
          <input type="checkbox" name="llmSecondPass" defaultChecked={props.llmSecondPass} className="mt-0.5 size-[18px] accent-acc" />
          <span>
            <span className="font-semibold">Second pass with the local model</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">Asks Ollama for any names the rules missed. If Ollama is down, the cloud call is refused.</span>
          </span>
        </label>
        <div className="flex items-center justify-end gap-3">
          {state.message ? <InlineAlert tone={state.ok ? "ok" : "bad"} role="status" className="mr-auto py-2">{state.message}</InlineAlert> : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save redaction"}</Button>
        </div>
      </form>
      <RedactionPreviewBox />
    </div>
  );
}

function RedactionPreviewBox() {
  const [sample, setSample] = useState(SAMPLE);
  const [result, setResult] = useState<RedactionPreview | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid content-start gap-3 rounded-xl border border-line bg-surface2 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-acc-t text-acc" aria-hidden>
          <EyeOffIcon className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Try redaction</h3>
          <p className="text-[12.5px] text-muted-foreground">Runs on this laptop with the saved settings. Nothing is sent or logged.</p>
        </div>
      </div>
      <label htmlFor="redaction-sample" className="sr-only">Sample text</label>
      <Textarea id="redaction-sample" rows={5} value={sample} onChange={(e) => setSample(e.target.value)} className="bg-card text-[14px]" />
      <div>
        <Button type="button" variant="soft" size="sm" disabled={pending || !sample.trim()} onClick={() => startTransition(async () => setResult(await previewRedaction(sample)))}>
          {pending ? "Redacting…" : "Redact sample"}
        </Button>
      </div>
      {result ? (
        <div className="grid gap-2.5" role="status" aria-label="Redaction result">
          <pre className="rounded-[9px] border border-line bg-card p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{result.text}</pre>
          <div className="flex flex-wrap gap-1.5">
            {result.findings.length ? (
              result.findings.map((f) => (
                <StatusPill key={f.type} tone="acc">
                  {f.type} × {f.count}
                </StatusPill>
              ))
            ) : (
              <StatusPill tone="warn">Nothing masked</StatusPill>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
