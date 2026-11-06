// DAR periods: two per month, in Manila dates ("2026-10-16"). Each person picks which days they start on (their
// "scheme"): the 1st–15th and the 16th–end (the default), or the 3rd–17th and the 18th–2nd of the next month, as on Job
// Order DARs. A period's start date says which scheme it belongs to, so a saved DAR always reads back the same.
// Dates are plain "YYYY-MM-DD" strings so nothing shifts with the server's clock zone.

import { TIME_ZONE } from "@/lib/format";

export type Period = { start: string; end: string };
export type PeriodDay = { date: string; month: string; day: number; dow: string };

export const PERIOD_SCHEMES = ["1-16", "3-18"] as const;
export type PeriodScheme = (typeof PERIOD_SCHEMES)[number];
export const DEFAULT_SCHEME: PeriodScheme = "1-16";
export const SCHEME_LABELS: Record<PeriodScheme, string> = {
  "1-16": "1st–15th and 16th–end of the month",
  "3-18": "3rd–17th and 18th–2nd of the next month",
};
/** The two days of the month a scheme's periods start on. */
const STARTS: Record<PeriodScheme, [number, number]> = { "1-16": [1, 16], "3-18": [3, 18] };

export const isScheme = (v: unknown): v is PeriodScheme => typeof v === "string" && (PERIOD_SCHEMES as readonly string[]).includes(v);
/** A stored scheme, or the default for an empty or unknown one. */
export const schemeOf = (v: unknown): PeriodScheme => (isScheme(v) ? v : DEFAULT_SCHEME);

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
const iso = (t: Date) => `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
/** The date `n` days after (or before) a date. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = parts(date);
  return iso(new Date(Date.UTC(y, m - 1, d + n)));
}

/** The scheme a period's start date belongs to, or null when no scheme starts on that day. */
export function schemeOfStart(start: string): PeriodScheme | null {
  const day = parts(start)[2];
  return PERIOD_SCHEMES.find((s) => STARTS[s].includes(day)) ?? null;
}

/** The period a Manila date (or an instant) falls in, under a scheme. */
export function periodFor(date: string | Date, scheme: PeriodScheme = DEFAULT_SCHEME): Period {
  const [a, b] = STARTS[scheme];
  const [y, m, d] = parts(typeof date === "string" ? date : manilaDay(date));
  // The start: this month's second start, its first, or (before the first) last month's second.
  const start = d >= b ? iso(new Date(Date.UTC(y, m - 1, b))) : d >= a ? iso(new Date(Date.UTC(y, m - 1, a))) : iso(new Date(Date.UTC(y, m - 2, b)));
  const [sy, sm, sd] = parts(start);
  // The first period ends the day before the second starts; the second, the day before next month's first.
  const end = sd === a ? iso(new Date(Date.UTC(sy, sm - 1, b - 1))) : iso(new Date(Date.UTC(sy, sm, a - 1)));
  return { start, end };
}

/** A period from its start date, or null when it isn't a start day of any scheme in a real month. */
export function parsePeriod(start: string): Period | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  const scheme = schemeOfStart(start);
  return scheme ? periodFor(start, scheme) : null;
}

/** Whether the period is the first of its month (starts on the scheme's first day). */
export function isFirstHalf(p: Period): boolean {
  const scheme = schemeOfStart(p.start) ?? DEFAULT_SCHEME;
  return parts(p.start)[2] === STARTS[scheme][0];
}

/** The period before `p`, in the same scheme. */
export function previousPeriod(p: Period): Period {
  return periodFor(addDays(p.start, -1), schemeOfStart(p.start) ?? DEFAULT_SCHEME);
}

/** The period after `p`, in the same scheme. */
export function nextPeriod(p: Period): Period {
  return periodFor(addDays(p.end, 1), schemeOfStart(p.start) ?? DEFAULT_SCHEME);
}

/** The two periods that start in a month ("2026-11"), under a scheme. */
export function monthPeriods(month: string, scheme: PeriodScheme = DEFAULT_SCHEME): [Period, Period] {
  const [a, b] = STARTS[scheme];
  return [periodFor(`${month}-${pad(a)}`, scheme), periodFor(`${month}-${pad(b)}`, scheme)];
}

/** More than anyone needs (10 years), so a bad stored date can't make a huge list. */
const MAX_LISTED = 240;

/**
 * A person's periods, newest first: from their first one to the current one, and always both halves of the first month, even
 * when the second half hasn't come yet. The scheme is the first period's.
 */
export function periodsFrom(first: Period, today: string): Period[] {
  const current = periodFor(today, schemeOfStart(first.start) ?? DEFAULT_SCHEME);
  const firstMonthEnd = isFirstHalf(first) ? nextPeriod(first) : first;
  let at = current.start > firstMonthEnd.start ? current : firstMonthEnd;
  const out: Period[] = [];
  while (at.start >= first.start && out.length < MAX_LISTED) {
    out.push(at);
    at = previousPeriod(at);
  }
  return out;
}

/**
 * Where a person's list starts: the first period they chose, else the earliest DAR they saved, else unknown. Moved into
 * their scheme, so switching schemes keeps the list starting at about the same date.
 */
export function firstPeriodOf(chosen: string | null | undefined, savedStarts: string[], scheme: PeriodScheme = DEFAULT_SCHEME): Period | null {
  const earliest = [...savedStarts].sort()[0];
  const p = parsePeriod(chosen ?? "") ?? (earliest ? parsePeriod(earliest) : null);
  return p ? periodFor(p.start, scheme) : null;
}

/** Months to choose a first DAR from ("2026-11"), newest first: the last year and the next two months, plus `keep`. */
export function monthOptions(today: string, keep?: string): string[] {
  const [y, m] = parts(today);
  const months = Array.from({ length: 15 }, (_, i) => {
    const at = new Date(Date.UTC(y, m - 1 + 2 - i, 1));
    return `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}`;
  });
  return keep && !months.includes(keep) ? [...months, keep].sort().reverse() : months;
}

/** "November 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** The current period first, then the `n - 1` before it. */
export function recentPeriods(today: string, n = 6, scheme: PeriodScheme = DEFAULT_SCHEME): Period[] {
  const out = [periodFor(today, scheme)];
  while (out.length < n) out.push(previousPeriod(out[out.length - 1]));
  return out;
}

/** Every day of a period, in order. A 18th–2nd period runs into the next month. */
export function periodDays(p: Period): PeriodDay[] {
  const out: PeriodDay[] = [];
  // At most 17 days; the cap only guards against a bad stored period.
  for (let date = p.start; date <= p.end && out.length < 31; date = addDays(date, 1)) {
    const [y, m, d] = parts(date);
    out.push({ date, month: MONTHS[m - 1], day: d, dow: DOWS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] });
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
