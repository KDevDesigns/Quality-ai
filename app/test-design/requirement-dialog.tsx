"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { saveRequirement, type SaveRequirementState } from "./actions";

export type RequirementValues = {
  id: string;
  title: string;
  text: string;
  moduleId: string | null;
  processId: string | null;
  sensitive: boolean;
};

type Option = { id: string; name: string };
type ProcessOption = Option & { moduleId: string };

const ACCEPT = ".md,.txt,.docx,.pdf";

export function RequirementDialog({ requirement, modules, processes }: { requirement?: RequirementValues; modules: Option[]; processes: ProcessOption[] }) {
  return (
    <FormDialog
      wide
      title={requirement ? "Edit requirement" : "New requirement"}
      description="Paste the requirement or upload a document. Mark it sensitive if it holds customer names, account numbers, amounts or other personal data."
      trigger={
        requirement ? (
          <Button variant="outline">
            <PencilIcon /> Edit
          </Button>
        ) : (
          <Button>
            <PlusIcon /> New requirement
          </Button>
        )
      }
    >
      {(close) => <RequirementForm requirement={requirement} modules={modules} processes={processes} onDone={close} />}
    </FormDialog>
  );
}

function RequirementForm({ requirement, modules, processes, onDone }: { requirement?: RequirementValues; modules: Option[]; processes: ProcessOption[]; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: SaveRequirementState, fd: FormData) => {
    const r = await saveRequirement(prev, fd);
    if (r.ok) {
      onDone();
      if (!requirement && r.id) router.push(`/test-design/${r.id}`);
    }
    return r;
  }, initialFormState);

  const [moduleId, setModuleId] = useState(requirement?.moduleId ?? "");
  const [processId, setProcessId] = useState(requirement?.processId ?? "");
  const [body, setBody] = useState(requirement?.text ?? "");
  const [sourceFile, setSourceFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const moduleProcesses = moduleId ? processes.filter((p) => p.moduleId === moduleId) : processes;
  const err = state.fieldErrors ?? {};

  const upload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/test-design/extract", { method: "POST", body: fd });
      const json = (await res.json()) as { text?: string; fileName?: string; error?: string };
      if (!res.ok || !json.text) throw new Error(json.error ?? "The file couldn't be read.");
      setBody(json.text);
      setSourceFile(json.fileName ?? file.name);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <form action={action} className="grid gap-4">
      {requirement ? <input type="hidden" name="id" value={requirement.id} /> : null}
      <input type="hidden" name="source" value={sourceFile ? "upload" : "paste"} />
      {sourceFile ? <input type="hidden" name="sourceFile" value={sourceFile} /> : null}

      <Field label="Title" htmlFor="title" error={err.title} required>
        <Input id="title" name="title" defaultValue={requirement?.title} required maxLength={200} placeholder="e.g. Late payment penalty" aria-invalid={!!err.title} />
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
            <option value="">Not module-specific</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Business process" htmlFor="processId" error={err.processId} hint="Its steps are sent with the prompt.">
          <select id="processId" name="processId" value={processId} onChange={(e) => setProcessId(e.target.value)} className={nativeSelectClass}>
            <option value="">None</option>
            {moduleProcesses.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Requirement text"
        htmlFor="text"
        error={err.text}
        required
        hint={sourceFile ? `Text from ${sourceFile}. Check it before saving.` : `Paste text, or upload ${ACCEPT.replaceAll(",", ", ")} (5 MB max).`}
      >
        <div className="flex justify-end">
          <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" id="file" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <FileUpIcon /> {uploading ? "Reading…" : "Upload file"}
          </Button>
        </div>
        <Textarea
          id="text"
          name="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          required
          maxLength={60_000}
          className={cn("font-mono text-[13px]", uploading && "opacity-60")}
          placeholder="A penalty of … applies to unpaid bills one day after the due date…"
          aria-invalid={!!err.text}
        />
      </Field>
      {uploadError ? <InlineAlert tone="bad" role="alert">{uploadError}</InlineAlert> : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface2 px-3.5 py-3">
        <input type="checkbox" name="sensitive" defaultChecked={requirement?.sensitive ?? false} className="mt-0.5 size-[18px] accent-acc" />
        <span className="grid gap-0.5 text-sm">
          <span className="font-medium">Sensitive</span>
          <span className="text-[13px] text-muted-foreground">Names, account and meter numbers, IDs and amounts are masked before anything goes to the cloud model.</span>
        </span>
      </label>

      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || uploading}>{pending ? "Saving…" : requirement ? "Save" : "Save and open"}</Button>
      </div>
    </form>
  );
}
