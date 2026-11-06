// Days off a DAR marks as REST DAY by default: Saturdays, Sundays and holidays. Pure functions, unit-tested.
//
// Holidays: the Philippines' regular and special non-working days that fall on the same date every year, Holy Week
// (worked out from Easter), National Heroes Day (last Monday of August) and Araw ng Dabaw (Davao City, March 16).
// Holidays proclaimed each year (Eid'l Fitr, Eid'l Adha, Chinese New Year, moved or extra days off) aren't known in
// advance: the day still shows "-", and anyone can type REST DAY over it. Every default can be edited.

/** "MM-DD" of the holidays on the same date every year. */
const FIXED: Record<string, string> = {
  "01-01": "New Year's Day",
  "02-25": "EDSA People Power Revolution Anniversary",
  "03-16": "Araw ng Dabaw",
  "04-09": "Araw ng Kagitingan",
  "05-01": "Labor Day",
  "06-12": "Independence Day",
  "08-21": "Ninoy Aquino Day",
  "11-01": "All Saints' Day",
  "11-02": "All Souls' Day",
  "11-30": "Bonifacio Day",
  "12-08": "Feast of the Immaculate Conception of Mary",
  "12-24": "Christmas Eve",
  "12-25": "Christmas Day",
  "12-30": "Rizal Day",
  "12-31": "Last Day of the Year",
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Easter Sunday of a year (the Gregorian computus). */
export function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The holidays of a year that move: Holy Week and National Heroes Day. */
function moving(year: number): Record<string, string> {
  const e = Date.parse(`${easter(year)}T00:00:00Z`);
  const day = (offset: number) => iso(new Date(e + offset * 86_400_000));
  // The last Monday of August.
  const aug31 = new Date(Date.UTC(year, 7, 31));
  const heroes = iso(new Date(Date.UTC(year, 7, 31 - ((aug31.getUTCDay() + 6) % 7))));
  return { [day(-3)]: "Maundy Thursday", [day(-2)]: "Good Friday", [day(-1)]: "Black Saturday", [heroes]: "National Heroes Day" };
}

/** The holiday on a date ("2026-12-25"), or null. */
export function holidayOn(date: string): string | null {
  return FIXED[date.slice(5)] ?? moving(Number(date.slice(0, 4)))[date] ?? null;
}

/** Saturdays, Sundays and holidays. */
export function isDayOff(date: string): boolean {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6 || holidayOn(date) !== null;
}
