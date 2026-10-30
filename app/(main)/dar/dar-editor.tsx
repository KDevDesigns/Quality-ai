"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, FileSpreadsheetIcon, PrinterIcon, RefreshCwIcon, SaveIcon, UserPenIcon } from "lucide-react";
import { Field, FormMessage, nativeSelectClass } from "@/components/form-field";
import { FormDialog } from "@/components/form-dialog";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysAttended, REST_DAY, type DarCells } from "@/lib/dar/autofill";
import { darHtml, PRINT_PAGE, PRINT_PAPER } from "@/lib/dar/html";
import type { DarReportData } from "@/lib/dar/store";
import type { DarTemplate } from "@/lib/dar/template";
import { initialFormState, type FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { submitKeepingInput } from "../tickets/ticket-form";
import { refillDar, saveDar, saveDarProfile } from "./actions";
import { DarSheet } from "./dar-sheet";
import { FunctionsEditor } from "./functions-editor";

type PeriodOption = { start: string; label: string; saved: boolean };
type ProfileValues = { fullName: string; position: string; ownFunctions: boolean };

export function DarEditor({
  report,
  periods,
  template,
  profile,
  accountName,
}: {
  report: DarReportData;
  periods: PeriodOption[];
  template: DarTemplate;
  profile: ProfileValues;
  accountName: string;
}) {
  const router = useRouter();
  const [cells, setCells] = useState<DarCells>(report.cells);
  const [dateSubmitted, setDateSubmitted] = useState(report.dateSubmitted);
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState<FormState | null>(null);
  const [busy, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);

  const attended = daysAttended(cells);
  const period = report.period.start;
  const h = report.header;

  // Unsaved edits are lost on leaving; let the browser ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function setCell(section: keyof DarCells, row: number, day: number, value: string) {
    setCells((c) => ({ ...c, [section]: c[section].map((r, i) => (i === row ? r.map((v, j) => (j === day ? value : v)) : r)) }));
    setDirty(true);
  }

  async function save(): Promise<boolean> {
    const fd = new FormData();
    fd.set("period", period);
    fd.set("cells", JSON.stringify(cells));
    fd.set("dateSubmitted", dateSubmitted);
    const r = await saveDar(initialFormState, fd);
    setNote(r);
    if (r.ok) {
      setDirty(false);
      router.refresh();
    }
    return r.ok;
  }

  function refill() {
    if (!window.confirm("Fill the days in again from your ticket work? This replaces what's in the rows marked “from my ticket work”. Other rows are kept.")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("period", period);
      const r = await refillDar(initialFormState, fd);
      setNote(r);
      if (r.ok && r.cells) {
        setCells(r.cells);
        setDirty(false);
        router.refresh();
      }
    });
  }

  async function download() {
    setDownloading(true);
    try {
      if (dirty && !(await save())) return;
      const res = await fetch(`/dar/export?period=${period}&format=xlsx`);
      if (!res.ok) {
        setNote({ ok: false, message: (await res.text()) || "The download failed. Try again." });
        return;
      }
      const name = decodeURIComponent(/filename\*=UTF-8''([^;]+)/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "DAR.xlsx");
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  /** Prints the sheet as it is now (saved or not) on one landscape long bond (8.5 × 13 in) page. Save as PDF from the print dialog. */
  function print() {
    const html = darHtml({ ...report, cells, dateSubmitted, daysAttended: attended }, { seal: `${location.origin}/dcwd-seal.png`, title: `DAR ${report.period.start}` });
    const frame = document.createElement("iframe");
    Object.assign(frame.style, { position: "fixed", left: "-10000px", top: "0", width: `${PRINT_PAPER.width}px`, height: `${PRINT_PAPER.height}px`, border: "0" });
    frame.setAttribute("aria-hidden", "true");
    frame.onload = () => {
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      if (!doc || !win) return frame.remove();
      const go = () => {
        // Shrink the sheet (not the margins) to fit inside them on one page, like the paper form.
        const zoom = Math.min(1, (PRINT_PAGE.height - 4) / doc.body.scrollHeight);
        if (zoom < 1) doc.body.style.zoom = String(zoom);
        win.addEventListener("afterprint", () => frame.remove());
        win.focus();
        win.print();
      };
      const seal = doc.querySelector("img");
      if (seal && !seal.complete) seal.onload = seal.onerror = go;
      else go();
    };
    frame.srcdoc = html;
    document.body.append(frame);
  }

  return (
    // data-full-width lets the page use the whole width (see app/(main)/layout.tsx), so the sheet fills it.
    <div className="grid gap-5" data-full-width>
      {!profile.fullName ? (
        <InlineAlert tone="warn">
          Your report shows your QA Hub nickname, <strong>{accountName}</strong>. Add your full name as it appears on official forms under <strong>My details</strong>.
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Period" htmlFor="period" className="w-72">
            <select
              id="period"
              value={period}
              className={nativeSelectClass}
              onChange={(e) => {
                if (dirty && !window.confirm("You have unsaved changes. Leave this period without saving?")) return;
                setDirty(false);
                router.push(`/dar?period=${e.target.value}`);
              }}
            >
              {periods.map((p) => (
                <option key={p.start} value={p.start}>
                  {p.label}
                  {p.saved ? " · saved" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DetailsDialog profile={profile} template={template} header={h} onSaved={() => router.refresh()} />
          <Button variant="outline" onClick={refill} disabled={busy}>
            <RefreshCwIcon className={cn(busy && "animate-spin")} /> Refill from tickets
          </Button>
          <Button variant="outline" onClick={() => startTransition(async () => void (await save()))} disabled={busy || !dirty}>
            {dirty ? <SaveIcon /> : <CheckIcon />} {dirty ? "Save" : report.saved || note?.ok ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" onClick={print}>
            <PrinterIcon /> Print
          </Button>
          <Button onClick={download} disabled={downloading}>
            <FileSpreadsheetIcon /> {downloading ? "Preparing…" : "Excel"}
          </Button>
        </div>
      </div>

      {note && !note.ok ? <FormMessage state={note} /> : null}
      {note?.ok && note.message !== "Saved." ? (
        <p role="status" className="text-[13px] text-muted-foreground">
          {note.message}
        </p>
      ) : null}

      <DarSheet
        report={report}
        cells={cells}
        dateSubmitted={dateSubmitted}
        daysAttended={attended}
        onCell={setCell}
        onDateSubmitted={(d) => {
          setDateSubmitted(d);
          setDirty(true);
        }}
      />
      <p className="-mt-2 text-[12.5px] text-muted-foreground">
        Click any day to type in it. Rows marked <span className="font-medium text-acc">↻ from my ticket work</span> are filled from the tickets you filed, replied to
        or moved each day, using the module Codes in Team &amp; modules. A day with nothing is {REST_DAY}; type over it if you worked outside QA Hub (e.g. HR201,
        encoding). Click the date submitted to change it.
      </p>
    </div>
  );
}

function DetailsDialog({ profile, template, header, onSaved }: { profile: ProfileValues; template: DarTemplate; header: DarReportData["header"]; onSaved: () => void }) {
  return (
    <FormDialog
      wide
      title="My DAR details"
      description="What appears on your report. Leave a field empty to use the admin's template."
      trigger={
        <Button variant="outline">
          <UserPenIcon /> My details
        </Button>
      }
    >
      {(close) => (
        <DetailsForm
          profile={profile}
          template={template}
          header={header}
          onDone={() => {
            close();
            onSaved();
          }}
        />
      )}
    </FormDialog>
  );
}

function DetailsForm({ profile, template, header, onDone }: { profile: ProfileValues; template: DarTemplate; header: DarReportData["header"]; onDone: () => void }) {
  const [useTemplate, setUseTemplate] = useState(!profile.ownFunctions);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await saveDarProfile(prev, fd);
    if (r.ok) onDone();
    return r;
  }, initialFormState);
  const err = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitKeepingInput(action)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={err.fullName} hint="As on official forms, e.g. Juan D. Dela Cruz.">
          <Input id="fullName" name="fullName" defaultValue={profile.fullName} maxLength={120} autoFocus />
        </Field>
        <Field label="Position title" htmlFor="position" error={err.position} hint={`Empty uses “${template.position}”.`}>
          <Input id="position" name="position" defaultValue={profile.position} maxLength={120} placeholder={template.position} />
        </Field>
      </div>
      <label className="flex items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" name="useTemplate" checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)} className="size-4 accent-acc" />
        Use the template&apos;s duties and MFOs
      </label>
      {!useTemplate ? (
        <>
          <FunctionsEditor name="coreFunctions" label="A.) Core functions" initial={header.core} />
          <FunctionsEditor name="supportFunctions" label="B.) Support functions" initial={header.support} />
          {err.coreFunctions || err.supportFunctions ? <p className="text-[12.5px] font-medium text-destructive">Every row needs a duty.</p> : null}
        </>
      ) : null}
      <FormMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
      </div>
    </form>
  );
}
