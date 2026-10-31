// Times of day for the work-hours pickers, as minutes after midnight. Pure, unit-tested.

/** 450 → "07:30", the value the form posts. */
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** 720 → "12:00 PM", 0 → "12:00 AM": in words, so noon and midnight can't be mixed up. */
export const ampm = (min: number) => `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, "0")} ${min < 720 ? "AM" : "PM"}`;

/** Every `step` minutes across the day, plus `keep` (a saved time off the steps) in its place. */
export function timeOptions(step = 30, keep?: number): { value: string; label: string }[] {
  const mins = Array.from({ length: Math.ceil(1440 / step) }, (_, i) => i * step);
  if (keep !== undefined && keep >= 0 && keep < 1440 && !mins.includes(keep)) mins.push(keep);
  return mins.sort((a, b) => a - b).map((m) => ({ value: hhmm(m), label: ampm(m) }));
}
