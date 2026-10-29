// DAR periods: the 1st–15th and the 16th–end of each month, in Manila dates ("2026-10-16").
// Dates are plain "YYYY-MM-DD" strings so nothing shifts with the server's clock zone.

import { TIME_ZONE } from "@/lib/format";

export type Period = { start: string; end: string };
export type PeriodDay = { date: string; month: string; day: number; dow: string };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOWS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MANILA_OFFSET = "+08:00"; // the Philippines has no daylight saving

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** The Manila calendar date of an instant. */
export function manilaDay(d: Date): string {
  return ymd.format(d);
}

const pad = (n: number) => String(n).padStart(2, "0");
const parts = (date: string) => date.split("-").map(Number) as [number, number, number];
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based

/** The period a Manila date (or an instant) falls in. */
export function periodFor(date: string | Date): Period {
  const [y, m, d] = parts(typeof date === "string" ? date : manilaDay(date));
  const first = d <= 15;
  return { start: `${y}-${pad(m)}-${first ? "01" : "16"}`, end: `${y}-${pad(m)}-${first ? "15" : pad(daysInMonth(y, m))}` };
}

/** A period from its start date, or null when it isn't the 1st or 16th of a real month. */
export function parsePeriod(start: string): Period | null {
  const m = /^(\d{4})-(\d{2})-(01|16)$/.exec(start);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return periodFor(start);
}

/** The period before `p`. */
export function previousPeriod(p: Period): Period {
  const [y, m, d] = parts(p.start);
  if (d === 16) return periodFor(`${y}-${pad(m)}-01`);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return periodFor(`${py}-${pad(pm)}-16`);
}

/** The current period first, then the `n - 1` before it. */
export function recentPeriods(today: string, n = 6): Period[] {
  const out = [periodFor(today)];
  while (out.length < n) out.push(previousPeriod(out[out.length - 1]));
  return out;
}

export function periodDays(p: Period): PeriodDay[] {
  const [y, m, d1] = parts(p.start);
  const d2 = parts(p.end)[2];
  const out: PeriodDay[] = [];
  for (let d = d1; d <= d2; d++) {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    out.push({ date: `${y}-${pad(m)}-${pad(d)}`, month: MONTHS[m - 1], day: d, dow: DOWS[dow] });
  }
  return out;
}

/** The instants a period covers in Manila: [from, to). For database queries. */
export function periodRange(p: Period): { from: Date; to: Date } {
  const [y, m, d] = parts(p.end);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return {
    from: new Date(`${p.start}T00:00:00${MANILA_OFFSET}`),
    to: new Date(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T00:00:00${MANILA_OFFSET}`),
  };
}

const short = (date: string) => {
  const [, m, d] = parts(date);
  return `${MONTHS[m - 1][0]}${MONTHS[m - 1].slice(1).toLowerCase()} ${pad(d)}`;
};

/** "Oct 16, 2026 to Oct 31, 2026", as on the form. */
export function periodLabel(p: Period): string {
  return `${short(p.start)}, ${parts(p.start)[0]} to ${short(p.end)}, ${parts(p.end)[0]}`;
}

/** "Oct16-Oct31 2026", for file names. */
export function periodFileLabel(p: Period): string {
  return `${short(p.start).replace(" ", "")}-${short(p.end).replace(" ", "")} ${parts(p.end)[0]}`;
}

/** "October 22, 2026", the "Date Submitted" format. */
export function longDate(date: string): string {
  const [y, m, d] = parts(date);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, d)));
}
