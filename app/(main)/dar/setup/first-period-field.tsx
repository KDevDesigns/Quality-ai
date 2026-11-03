"use client";

import { useState } from "react";
import { Field } from "@/components/form-field";
import { SelectField } from "@/components/select-field";
import { monthLabel, monthOptions, parsePeriod, periodLabel, type Period } from "@/lib/dar/period";

/** Where the person's list of periods starts. The 1–15 and 16–end rule fixes the dates, so they pick a month and a half. */
export function FirstPeriodField({ initial, today, error }: { initial: string; today: string; error?: string[] }) {
  const [start, setStart] = useState(initial);
  const month = start.slice(0, 7);
  const half = start.slice(8);
  const halves = [`${month}-01`, `${month}-16`].map((s) => parsePeriod(s)).filter((p): p is Period => !!p);

  return (
    <div className="grid gap-4">
      <input type="hidden" name="firstPeriodStart" value={start} />
      <Field label="Month of your first DAR" htmlFor="firstMonth" error={error} hint="Your list of periods starts here. QA Hub adds each next 15 days by itself.">
        <SelectField id="firstMonth" value={month} onValueChange={(m) => setStart(`${m}-${half}`)} options={monthOptions(today, month).map((m) => ({ value: m, label: monthLabel(m) }))} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Which period comes first?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {halves.map((p, i) => (
            <label key={p.start} className="flex cursor-pointer items-center gap-2.5 rounded-[0.625rem] border border-line p-3 text-sm transition-colors has-checked:border-acc has-checked:bg-acc-t2 has-focus-visible:ring-3 has-focus-visible:ring-acc/25">
              <input type="radio" name="firstHalf" checked={start === p.start} onChange={() => setStart(p.start)} />
              <span className="grid min-w-0">
                <span className="font-medium">{i === 0 ? "1st half" : "2nd half"}</span>
                <span className="text-[0.8125rem] text-muted-foreground">{periodLabel(p)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
