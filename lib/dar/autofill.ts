// Fills a DAR's day cells from what the person did in QA Hub: each day lists the modules of the tickets they filed,
// replied on or moved that day ("QA - BCA / CRM", or "DEV - …" for developers); a day with no activity is a rest
// day. Pure functions, unit-tested.

import type { DarFunction } from "./template";
import { manilaDay, type PeriodDay } from "./period";

export const REST_DAY = "REST DAY";
/** What a day's entry starts with: developers write "DEV - BCA", QA testers and admins "QA - BCA". */
export const prefixFor = (role: string) => (role === "DEV" ? "DEV" : "QA");

export type ActivityArea = { name: string; code: string | null; parent: { name: string; code: string | null } | null } | null;
export type Activity = { at: Date; area: ActivityArea };

/** One string per day per function row. */
export type DarCells = { core: string[][]; support: string[][] };

/** The module as written in a cell: its Code, else its module's Code, else its name. */
export function areaLabel(area: NonNullable<ActivityArea>): string {
  return area.code?.trim() || area.parent?.code?.trim() || area.name;
}

/** What to write for each day: "QA - BCA / CRM", "QA" (tickets without a module) or "REST DAY". */
export function dayEntries(activity: Activity[], days: PeriodDay[], prefix = "QA"): string[] {
  const byDay = new Map<string, Activity[]>();
  for (const a of [...activity].sort((x, y) => x.at.getTime() - y.at.getTime())) {
    const d = manilaDay(a.at);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }
  return days.map(({ date }) => {
    const acts = byDay.get(date);
    if (!acts?.length) return REST_DAY;
    const labels = [...new Set(acts.flatMap((a) => (a.area ? [areaLabel(a.area)] : [])))];
    return labels.length ? `${prefix} - ${labels.join(" / ")}` : prefix;
  });
}

const blankRow = (n: number) => Array.from({ length: n }, () => "");

/** Fresh cells: the auto-fill rows get the day entries, the others start empty. */
export function buildCells(fns: { core: DarFunction[]; support: DarFunction[] }, entries: string[]): DarCells {
  const row = (f: DarFunction) => (f.autofill ? [...entries] : blankRow(entries.length));
  return { core: fns.core.map(row), support: fns.support.map(row) };
}

/**
 * Saved cells shaped to the current functions and days: rows added or removed in the template since, or a bad
 * stored value, never break the page. Rows the saved draft doesn't have yet start from `fresh`.
 */
export function fitCells(saved: unknown, fresh: DarCells): DarCells {
  const s = (saved ?? {}) as Partial<Record<keyof DarCells, unknown>>;
  const fit = (rows: unknown, fallback: string[][]) =>
    fallback.map((fb, i) => {
      const r = Array.isArray(rows) ? rows[i] : undefined;
      return Array.isArray(r) ? fb.map((_, j) => (typeof r[j] === "string" ? (r[j] as string).slice(0, 200) : "")) : fb;
    });
  return { core: fit(s.core, fresh.core), support: fit(s.support, fresh.support) };
}

/** Puts fresh day entries into the auto-fill rows, keeping what was typed in the other rows. */
export function refillCells(current: DarCells, fresh: DarCells, fns: { core: DarFunction[]; support: DarFunction[] }): DarCells {
  return {
    core: current.core.map((r, i) => (fns.core[i]?.autofill ? fresh.core[i] : r)),
    support: current.support.map((r, i) => (fns.support[i]?.autofill ? fresh.support[i] : r)),
  };
}

export const isRestDay = (cell: string) => /^rest\s*day$/i.test(cell.trim());

/** Days with any entry other than a rest day. */
export function daysAttended(cells: DarCells): number {
  const rows = [...cells.core, ...cells.support];
  const n = rows[0]?.length ?? 0;
  let count = 0;
  for (let d = 0; d < n; d++) if (rows.some((r) => r[d]?.trim() && !isRestDay(r[d]))) count++;
  return count;
}
