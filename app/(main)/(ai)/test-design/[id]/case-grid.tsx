"use client";

import { Fragment, useActionState, useState, useTransition } from "react";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/form";
import { PRIORITIES, TECHNIQUES, TEST_TYPES } from "@/lib/schemas/test-case";
import { cn } from "@/lib/utils";
import { bulkUpdateCases, saveTestCase, type BulkAction } from "../actions";
import { CASE_LABEL, CASE_TONE } from "../status";

export type CaseRow = {
  id: string;
  title: string;
  technique: string;
  priority: string;
  type: string;
  status: string;
  preconditions: string | null;
  steps: string[];
  expected: string;
  tags: string[];
  processStep: string | null;
  openQuestions: string[];
  aiGenerated: boolean;
};

const BULK: { action: BulkAction; label: string; variant: "default" | "outline" | "ghost" }[] = [
  { action: "approve", label: "Approve", variant: "default" },
  { action: "draft", label: "Back to draft", variant: "outline" },
  { action: "obsolete", label: "Mark obsolete", variant: "outline" },
  { action: "delete", label: "Delete drafts", variant: "ghost" },
];

export function CaseGrid({ requirementId, cases }: { requirementId: string; cases: CaseRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [showObsolete, setShowObsolete] = useState(false);
  const [message, setMessage] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = showObsolete ? cases : cases.filter((c) => c.status !== "OBSOLETE");
  const obsolete = cases.length - cases.filter((c) => c.status !== "OBSOLETE").length;
  const visibleIds = visible.map((c) => c.id);
  const chosen = visibleIds.filter((id) => selected.has(id));
  const allChosen = visibleIds.length > 0 && chosen.length === visibleIds.length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = (action: BulkAction) =>
    startTransition(async () => {
      const r = await bulkUpdateCases(requirementId, chosen, action);
      setMessage(r);
      if (r.ok) setSelected(new Set());
    });

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">{chosen.length ? `${chosen.length} selected` : "Select cases to approve them"}</span>
          {BULK.map((b) => (
            <Button key={b.action} size="sm" variant={b.variant} disabled={pending || !chosen.length} onClick={() => bulk(b.action)}>
              {b.label}
            </Button>
          ))}
          <span aria-live="polite" className={cn("text-[13px]", message?.ok ? "text-muted-foreground" : "text-bad")}>{message?.message}</span>
        </div>
        <div className="flex items-center gap-3">
          {obsolete ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={showObsolete} onChange={(e) => setShowObsolete(e.target.checked)} className="size-4 accent-acc" />
              Show {obsolete} obsolete
            </label>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setOpen(open === "new" ? null : "new")}>
            <PlusIcon /> Add case
          </Button>
        </div>
      </div>

      {open === "new" ? (
        <div className="rounded-xl border border-acc-b bg-card p-5">
          <CaseEditor requirementId={requirementId} onDone={() => setOpen(null)} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all cases"
                  checked={allChosen}
                  onChange={() => setSelected(allChosen ? new Set() : new Set(visibleIds))}
                  className="size-4 accent-acc"
                />
              </TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Case</TableHead>
              <TableHead>Technique</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No cases yet. Generate drafts above, or add one by hand.
                </TableCell>
              </TableRow>
            ) : null}
            {visible.map((c, i) => {
              const expanded = open === c.id;
              return (
                <Fragment key={c.id}>
                  <TableRow data-state={selected.has(c.id) ? "selected" : undefined} className={cn(c.status === "OBSOLETE" && "opacity-60")}>
                    <TableCell>
                      <input type="checkbox" aria-label={`Select ${c.title}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="size-4 accent-acc" />
                    </TableCell>
                    <TableCell className="font-mono text-[12.5px] text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="max-w-[380px] whitespace-normal">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : c.id)}
                        aria-expanded={expanded}
                        className="flex items-start gap-1.5 text-left font-medium hover:text-acc-ink"
                      >
                        {expanded ? <ChevronDownIcon className="mt-0.5 size-4 shrink-0" /> : <ChevronRightIcon className="mt-0.5 size-4 shrink-0" />}
                        <span>
                          {c.title}
                          {c.aiGenerated ? <SparklesIcon className="ml-1.5 inline size-3.5 text-acc" aria-label="AI draft" /> : null}
                        </span>
                      </button>
                      {c.processStep ? <div className="mt-0.5 pl-[22px] text-[12.5px] text-muted-foreground">{c.processStep}</div> : null}
                      {c.openQuestions.length ? <div className="mt-0.5 pl-[22px] text-[12.5px] text-warn-ink">{c.openQuestions.length} open question{c.openQuestions.length === 1 ? "" : "s"}</div> : null}
                    </TableCell>
                    <TableCell className="text-sm">{c.technique}</TableCell>
                    <TableCell className="font-mono text-[13px]">{c.priority}</TableCell>
                    <TableCell className="font-mono text-[13px]">{c.type}</TableCell>
                    <TableCell>
                      <StatusPill tone={CASE_TONE[c.status] ?? "neutral"}>{CASE_LABEL[c.status] ?? c.status}</StatusPill>
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal font-mono text-[12px] text-ink2">{c.tags.join(" ")}</TableCell>
                  </TableRow>
                  {expanded ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="bg-surface2 p-5 whitespace-normal">
                        <CaseEditor requirementId={requirementId} tc={c} onDone={() => setOpen(null)} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CaseEditor({ requirementId, tc, onDone }: { requirementId: string; tc?: CaseRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveTestCase(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);
  const err = state.fieldErrors ?? {};
  const key = tc?.id ?? "new";
  const locked = tc?.status === "AUTOMATED";

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="requirementId" value={requirementId} />
      {tc ? <input type="hidden" name="id" value={tc.id} /> : null}
      <Field label="Title" htmlFor={`title-${key}`} error={err.title} required>
        <Input id={`title-${key}`} name="title" defaultValue={tc?.title} required maxLength={200} disabled={locked} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Technique" htmlFor={`technique-${key}`} error={err.technique}>
          <select id={`technique-${key}`} name="technique" defaultValue={tc?.technique ?? TECHNIQUES[0]} className={nativeSelectClass} disabled={locked}>
            {TECHNIQUES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority" htmlFor={`priority-${key}`} error={err.priority}>
          <select id={`priority-${key}`} name="priority" defaultValue={tc?.priority ?? "P3"} className={nativeSelectClass} disabled={locked}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor={`type-${key}`} error={err.type}>
          <select id={`type-${key}`} name="type" defaultValue={tc?.type ?? "UI"} className={nativeSelectClass} disabled={locked}>
            {TEST_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Preconditions" htmlFor={`pre-${key}`} error={err.preconditions}>
        <Textarea id={`pre-${key}`} name="preconditions" defaultValue={tc?.preconditions ?? ""} rows={2} disabled={locked} />
      </Field>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Steps" htmlFor={`steps-${key}`} error={err.steps} hint="One step per line." required>
          <Textarea id={`steps-${key}`} name="steps" defaultValue={tc?.steps.join("\n")} rows={5} required disabled={locked} />
        </Field>
        <Field label="Expected result" htmlFor={`expected-${key}`} error={err.expected} hint="For amounts, name the oracle or recon check, not a number." required>
          <Textarea id={`expected-${key}`} name="expected" defaultValue={tc?.expected} rows={5} required disabled={locked} />
        </Field>
      </div>
      <Field label="Tags" htmlFor={`tags-${key}`} error={err.tags} hint="@smoke, @critical, @regression, @module:<name>, @process:<name>, @role:<role>. Other tags are dropped.">
        <Input id={`tags-${key}`} name="tags" defaultValue={tc?.tags.join(" ")} className="font-mono text-[13px]" disabled={locked} />
      </Field>
      {tc?.openQuestions.length ? (
        <div className="grid gap-1.5 text-sm">
          <span className="font-medium">Open questions</span>
          <ul className="list-disc pl-5 text-warn-ink">
            {tc.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <FormMessage state={state} />
      <div className="flex items-center justify-end gap-2">
        {locked ? <span className="mr-auto text-[13px] text-muted-foreground">Automated cases change through the spec review in Runs.</span> : null}
        {tc?.status === "APPROVED" ? <span className="mr-auto text-[13px] text-muted-foreground">Saving changes moves this case back to draft for re-approval.</span> : null}
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending || locked}>{pending ? "Saving…" : tc ? "Save case" : "Add case"}</Button>
      </div>
    </form>
  );
}
