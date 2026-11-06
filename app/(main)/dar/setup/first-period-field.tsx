"use client";

import { useState } from "react";
import { Field } from "@/components/form-field";
import { SelectField } from "@/components/select-field";
import { isFirstHalf, monthLabel, monthOptions, monthPeriods, parsePeriod, periodLabel, type PeriodScheme } from "@/lib/dar/period";

/**
 * Where the person's list of periods starts. Their period days (the scheme) fix the dates, so they pick a month and a
 * half; switching the scheme keeps the month and the half.
 */
export function FirstPeriodField({ initial, today, scheme, error }: { initial: string; today: string; scheme: PeriodScheme; error?: string[] }) {
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [half, setHalf] = useState<0 | 1>(() => {
    const p = parsePeriod(initial);
    return p && !isFirstHalf(p) ? 1 : 0;
  });
  const halves = monthPeriods(month, scheme);
  const start = halves[half].start;

  return (
    <div className="grid gap-4">
      <input type="hidden" name="firstPeriodStart" value={start} />
      <Field label="Month of your first DAR" htmlFor="firstMonth" error={error} hint="Your list of periods starts here. QA Hub adds each next period by itself.">
        <SelectField id="firstMonth" value={month} onValueChange={setMonth} options={monthOptions(today, month).map((m) => ({ value: m, label: monthLabel(m) }))} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Which period comes first?</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {halves.map((p, i) => (
            <label key={p.start} className="flex cursor-pointer items-center gap-2.5 rounded-[0.625rem] border border-line p-3 text-sm transition-colors has-checked:border-acc has-checked:bg-acc-t2 has-focus-visible:ring-3 has-focus-visible:ring-acc/25">
              <input type="radio" name="firstHalf" checked={half === i} onChange={() => setHalf(i as 0 | 1)} />
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
