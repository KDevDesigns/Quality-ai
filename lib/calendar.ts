// Month grids for the date picker (components/date-picker.tsx). Dates are "YYYY-MM-DD" strings, read as calendar days
// with no time zone, so the grid is the same on every computer. Pure, unit-tested.

export type CalendarDay = { date: string; day: number; inMonth: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** "2026-10-16" → { y: 2026, m: 10, d: 16 }; null if it isn't a real date. */
export function parseIsoDate(s: string): { y: number; m: number; d: number } | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!r) return null;
  const [y, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])];
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? { y, m, d } : null;
}

/** The month `n` months after (or before) year/month, e.g. December + 1 → next January. */
export function addMonths(y: number, m: number, n: number): { y: number; m: number } {
  const i = y * 12 + (m - 1) + n;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

/** The date `n` days after (or before) `date`. */
export function addDays(date: string, n: number): string {
  const p = parseIsoDate(date);
  if (!p) return date;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Six weeks (Sunday first) covering the month, with the days before and after it filled in. */
export function monthGrid(y: number, m: number): CalendarDay[] {
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = Date.UTC(y, m - 1, 1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => {
    const t = new Date(start + i * 86_400_000);
    return { date: isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()), day: t.getUTCDate(), inMonth: t.getUTCMonth() === m - 1 };
  });
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Today's date in Manila, where DCWD is, whatever the computer's own time zone. */
export const todayInManila = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
