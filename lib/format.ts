// Display formatting shared by pages. Times are shown in Philippine time whatever the server's clock zone is.

export const TIME_ZONE = "Asia/Manila";

const dateTime = new Intl.DateTimeFormat("en-PH", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" });

/** "Oct 29, 2026, 9:05 AM" */
export function formatDateTime(d: Date): string {
  return dateTime.format(d);
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
export function timeAgo(d: Date, now = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Intl.DateTimeFormat("en-PH", { timeZone: TIME_ZONE, dateStyle: "medium" }).format(d);
}

const shortDate = new Intl.DateTimeFormat("en-PH", { timeZone: TIME_ZONE, month: "short", day: "numeric" });
const manilaDay = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Phones, where a row has little room: "now", "5m", "3h", "2d", then "Nov 1". */
export function shortAgo(d: Date, now = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return shortDate.format(d);
}

/** Which day heading a time falls under in a phone list, by the Philippine calendar day. */
export function dayGroup(d: Date, now = new Date()): "Today" | "Yesterday" | "Earlier" {
  const day = (x: Date) => manilaDay.format(x);
  if (day(d) === day(now)) return "Today";
  if (day(d) === day(new Date(now.getTime() - 86400_000))) return "Yesterday";
  return "Earlier";
}

/** "Ana Reyes Cruz" → "AR" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** "1.2 MB", "340 KB" */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** 102 → "1:42" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
