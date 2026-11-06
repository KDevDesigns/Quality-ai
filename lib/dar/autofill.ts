// Fills a DAR's day cells from what the person did in QA Hub: each day lists the modules of the tickets they filed,
// replied on or moved that day ("QA - BCA / CRM", or "DEV - …" for developers). Every other cell starts with the
// default: REST DAY on Saturdays, Sundays and holidays, and "-" (nothing done) on work days. Every cell stays editable.
// Pure functions, unit-tested.

import type { DarFunction } from "./template";
import { isDayOff } from "./holidays";
import { manilaDay, type PeriodDay } from "./period";

export const REST_DAY = "REST DAY";
/** A work day with nothing done in that row, as the paper form writes it. */
export const NO_ENTRY = "-";

/** What an empty cell starts as: REST DAY on weekends and holidays, "-" on work days. */
export const defaultEntry = (day: { date: string }) => (isDayOff(day.date) ? REST_DAY : NO_ENTRY);
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

/** What to write for each day: "QA - BCA / CRM", "QA" (tickets without a module), or the default (REST DAY or "-"). */
export function dayEntries(activity: Activity[], days: PeriodDay[], prefix = "QA"): string[] {
  const byDay = new Map<string, Activity[]>();
  for (const a of [...activity].sort((x, y) => x.at.getTime() - y.at.getTime())) {
    const d = manilaDay(a.at);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }
  return days.map(({ date }) => {
    const acts = byDay.get(date);
    if (!acts?.length) return defaultEntry({ date });
    const labels = [...new Set(acts.flatMap((a) => (a.area ? [areaLabel(a.area)] : [])))];
    return labels.length ? `${prefix} - ${labels.join(" / ")}` : prefix;
  });
}

/** The longest a day's entry may be: room for a few tasks, as people write them on the paper form. */
export const CELL_MAX = 500;

/**
 * Fresh cells: the auto-fill rows get the day entries; the others start with each day's default when `days` is given,
 * else empty (a shape only).
 */
export function buildCells(fns: { core: DarFunction[]; support: DarFunction[] }, entries: string[], days?: PeriodDay[]): DarCells {
  const other = () => (days ? days.map(defaultEntry) : entries.map(() => ""));
  const row = (f: DarFunction) => (f.autofill ? [...entries] : other());
  return { core: fns.core.map(row), support: fns.support.map(row) };
}

/** Empty cells (an import's blank days) take each day's default. */
export function fillDefaults(cells: DarCells, days: { date: string }[]): DarCells {
  const fill = (rows: string[][]) => rows.map((r) => r.map((v, j) => (v.trim() ? v : days[j] ? defaultEntry(days[j]) : v)));
  return { core: fill(cells.core), support: fill(cells.support) };
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
      return Array.isArray(r) ? fb.map((_, j) => (typeof r[j] === "string" ? (r[j] as string).slice(0, CELL_MAX) : "")) : fb;
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
/** A cell that says nothing was done: empty, or dashes. */
export const isNoEntry = (cell: string) => /^[-–—\s]*$/.test(cell);

/** Days with any entry other than a rest day or a dash. */
export function daysAttended(cells: DarCells): number {
  const rows = [...cells.core, ...cells.support];
  const n = rows[0]?.length ?? 0;
  let count = 0;
  for (let d = 0; d < n; d++) if (rows.some((r) => r[d] !== undefined && !isNoEntry(r[d]) && !isRestDay(r[d]))) count++;
  return count;
}
