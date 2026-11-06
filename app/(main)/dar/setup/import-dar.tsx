"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DarImportError, MAX_IMPORT_BYTES, parseDarWorkbook, type DarImport } from "@/lib/dar/import";
import { SCHEME_LABELS } from "@/lib/dar/period";
import { importDar } from "../actions";

// Set up My DAR from the Excel workbook someone already keeps: pick the file, check what was read, tick the periods,
// Import. The file is read here in the browser and never uploaded; Import sends only what was read.

export function ImportDar({ savedStarts }: { savedStarts: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [data, setData] = useState<DarImport | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, startSaving] = useTransition();
  const saved = new Set(savedStarts);

  async function read(f: File) {
    setError(null);
    setData(null);
    setFile(f.name);
    if (f.size > MAX_IMPORT_BYTES) return setError("This file is too big to be a DAR. Pick your DAR workbook (.xlsx).");
    setReading(true);
    try {
      const d = parseDarWorkbook(new Uint8Array(await f.arrayBuffer()));
      setData(d);
      // Periods with a DAR saved in QA Hub stay unticked, so nothing is replaced unless they ask.
      setPicked(new Set(d.periods.filter((p) => !saved.has(p.period.start)).map((p) => p.period.start)));
    } catch (e) {
      setError(e instanceof DarImportError ? e.message : "QA Hub couldn't read this file. Save it as .xlsx (Excel Workbook) and try again.");
    } finally {
      setReading(false);
      if (input.current) input.current.value = "";
    }
  }

  function cancel() {
    setData(null);
    setFile(null);
    setError(null);
  }

  function apply() {
    if (!data) return;
    const reports = data.periods
      .filter((p) => picked.has(p.period.start))
      .map((p) => ({ periodStart: p.period.start, cells: p.cells, dateSubmitted: p.dateSubmitted }));
    startSaving(async () => {
      const r = await importDar(JSON.stringify({ profile: data.profile, reports }));
      if (!r.ok) return setError(r.message ?? "The import didn't work. Try again.");
      // Open the newest imported period, ready to check and add what's missing.
      router.push(r.period ? `/dar?period=${r.period}` : "/dar");
    });
  }

  const toggle = (start: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(start);
    else next.delete(start);
    setPicked(next);
  };
  const p = data?.profile;
  const duties = (fns: DarImport["profile"]["coreFunctions"]) => fns.filter((f) => !f.continues).length;

  return (
    <Card id="import">
      <CardHeader>
        <CardTitle>Import from Excel</CardTitle>
        <CardDescription>
          Already keep your DAR in Excel? Pick the workbook. QA Hub reads your details, duties and MFOs, your period days, and what you wrote on
          each day. You can check it all before anything is saved, and edit any period afterwards.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          id="darFile"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void read(f);
          }}
        />
        {!data ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={reading} onClick={() => input.current?.click()}>
              <FileUpIcon /> {reading ? "Reading…" : "Choose Excel file"}
            </Button>
            <span className="text-[0.8125rem] text-muted-foreground">{file ?? "An .xlsx file with one DAR sheet per period."}</span>
          </div>
        ) : null}

        {error ? (
          <InlineAlert tone="bad" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {data && p ? (
          <div className="grid gap-4">
            <p className="text-sm">
              Read from <span className="font-medium">{file}</span>. Check it, tick the periods to bring in, then Import.
            </p>
            <dl className="grid gap-x-6 gap-y-2 rounded-[0.625rem] border border-line p-3 text-[0.8125rem] sm:grid-cols-2">
              <Fact label="Name">{p.fullName}</Fact>
              <Fact label="Position">{p.position}</Fact>
              <Fact label="Department">{p.department}</Fact>
              <Fact label="Unit">{p.unit}</Fact>
              <Fact label="Confirmed by">{[p.confirmedBy.name, p.confirmedBy.title].filter(Boolean).join(", ")}</Fact>
              <Fact label="Noted by">{[p.notedBy.name, p.notedBy.title].filter(Boolean).join(", ")}</Fact>
              <Fact label="Period days">{SCHEME_LABELS[p.periodScheme]}</Fact>
              <Fact label="Duties">
                {duties(p.coreFunctions)} core ({p.coreFunctions.length} MFO rows), {duties(p.supportFunctions)} support ({p.supportFunctions.length} MFO rows)
              </Fact>
            </dl>

            {data.warnings.length ? (
              <InlineAlert tone="warn">
                <ul className="list-disc pl-4">
                  {data.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </InlineAlert>
            ) : null}

            <fieldset className="grid gap-2">
              <legend className="mb-1 flex w-full flex-wrap items-center justify-between gap-2 text-sm font-medium">
                <span>
                  Periods to bring in ({picked.size} of {data.periods.length})
                </span>
                <span className="flex gap-2 text-[0.8125rem] font-normal">
                  <button type="button" className="text-primary-text hover:underline" onClick={() => setPicked(new Set(data.periods.map((x) => x.period.start)))}>
                    All
                  </button>
                  <button type="button" className="text-primary-text hover:underline" onClick={() => setPicked(new Set())}>
                    None
                  </button>
                </span>
              </legend>
              <div className="grid max-h-80 gap-1.5 overflow-y-auto rounded-[0.625rem] border border-line p-2 sm:grid-cols-2">
                {data.periods.map((x) => (
                  <label key={x.period.start} className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2 text-sm hover:bg-row-hover has-focus-visible:ring-3 has-focus-visible:ring-acc/25">
                    <input type="checkbox" className="mt-1" checked={picked.has(x.period.start)} onChange={(e) => toggle(x.period.start, e.target.checked)} />
                    <span className="grid min-w-0">
                      <span className="font-medium">{x.label}</span>
                      <span className="text-[0.7813rem] text-muted-foreground">
                        {x.filledDays} day{x.filledDays === 1 ? "" : "s"} with entries
                        {saved.has(x.period.start) ? " · replaces the DAR saved here" : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="text-[0.8125rem] text-muted-foreground">
              Import replaces My details below with what was read. Each imported period opens in My DAR, where you can add tasks that weren&apos;t
              written down and save.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={saving}>
                Choose another file
              </Button>
              <Button type="button" onClick={apply} disabled={saving}>
                {saving ? "Importing…" : picked.size ? `Import details and ${picked.size} period${picked.size === 1 ? "" : "s"}` : "Import details only"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="wrap-anywhere">{children || <span className="text-muted-foreground">Not found</span>}</dd>
    </div>
  );
}
