"use client";

import { useState, useTransition } from "react";
import { EyeIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { previewRequirementRedaction, type RequirementRedactionPreview } from "../actions";

export function RedactionPreview({ requirementId }: { requirementId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RequirementRedactionPreview | null>(null);
  const [missing, setMissing] = useState(false);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-muted-foreground">
          See what the cloud model receives. This runs on this machine only. If the local-model second pass is on in Settings, it masks any extra names at generation time.
        </p>
        <Button
          variant="soft"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await previewRequirementRedaction(requirementId);
              setMissing(!r);
              setResult(r);
            })
          }
        >
          <EyeIcon /> {pending ? "Masking…" : result ? "Refresh preview" : "Preview what the cloud sees"}
        </Button>
      </div>
      {missing ? <InlineAlert tone="bad" role="alert">The requirement no longer exists.</InlineAlert> : null}
      {result ? (
        <>
          <InlineAlert tone={result.total ? "ok" : "warn"} role="status">
            {result.total
              ? `${result.total} item${result.total === 1 ? "" : "s"} masked: ${result.findings.map((f) => `${f.count} ${f.type.toLowerCase().replace("_", " ")}`).join(", ")}.`
              : "Nothing was masked. If this text has names, add them to the names list in Settings → Redaction."}
          </InlineAlert>
          <pre className="max-h-80 overflow-auto rounded-[10px] border border-line bg-surface2 p-3.5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">{result.text}</pre>
        </>
      ) : null}
    </div>
  );
}
