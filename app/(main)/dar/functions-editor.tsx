"use client";

import { useState } from "react";
import { ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DarFunction } from "@/lib/dar/template";

// The list of core or support functions on a DAR: the duty, its MFO, and whether the row gets the days filled in
// from ticket work. Posted as JSON in a hidden input named `name`; rows with no duty are left out.

export function FunctionsEditor({ name, label, initial }: { name: string; label: string; initial: DarFunction[] }) {
  const [rows, setRows] = useState<DarFunction[]>(initial);
  const set = (i: number, patch: Partial<DarFunction>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const kept = rows.filter((r) => r.duty.trim());

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(kept)} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2.5 rounded-[10px] border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-muted-foreground">Row {i + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move row ${i + 1} up`} disabled={i === 0} onClick={() => setRows([...rows.slice(0, i - 1), r, rows[i - 1], ...rows.slice(i + 1)])}>
                <ArrowUpIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove row ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                <Trash2Icon />
              </Button>
            </div>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            <label className="grid content-start gap-1.5 text-[13px]">
              Duty
              <Textarea value={r.duty} onChange={(e) => set(i, { duty: e.target.value })} rows={4} maxLength={1000} />
            </label>
            <label className="grid content-start gap-1.5 text-[13px]">
              Major final output (MFO)
              <Textarea value={r.mfo} onChange={(e) => set(i, { mfo: e.target.value })} rows={4} maxLength={1000} placeholder="One per line, e.g. • Performs documentation and test reports" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={r.autofill} onChange={(e) => set(i, { autofill: e.target.checked })} />
            Fill this row&apos;s days from my ticket work
          </label>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={rows.length >= 10} onClick={() => setRows([...rows, { duty: "", mfo: "", autofill: false }])}>
        <PlusIcon /> Add row
      </Button>
    </fieldset>
  );
}
