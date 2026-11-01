import { describe, expect, it } from "vitest";
import { dayGroup, formatBytes, formatDateTime, formatDuration, initials, shortAgo, timeAgo } from "@/lib/format";

describe("format", () => {
  const now = new Date("2026-10-29T01:00:00Z");

  it("has a short form for phones", () => {
    expect(shortAgo(new Date(now.getTime() - 20_000), now)).toBe("now");
    expect(shortAgo(new Date(now.getTime() - 5 * 60_000), now)).toBe("5m");
    expect(shortAgo(new Date(now.getTime() - 3 * 3_600_000), now)).toBe("3h");
    expect(shortAgo(new Date(now.getTime() - 2 * 86_400_000), now)).toBe("2d");
    expect(shortAgo(new Date("2026-08-01T00:00:00Z"), now)).toBe("Aug 1");
  });

  it("groups by the Philippine calendar day", () => {
    // now is 09:00 on Oct 29 in Manila.
    expect(dayGroup(new Date("2026-10-28T17:00:00Z"), now)).toBe("Today"); // 01:00 Oct 29 Manila
    expect(dayGroup(new Date("2026-10-28T15:00:00Z"), now)).toBe("Yesterday"); // 23:00 Oct 28 Manila
    expect(dayGroup(new Date("2026-10-26T15:00:00Z"), now)).toBe("Earlier");
  });

  it("shows relative times, then the date", () => {
    expect(timeAgo(new Date(now.getTime() - 20_000), now)).toBe("just now");
    expect(timeAgo(new Date(now.getTime() - 5 * 60_000), now)).toBe("5 min ago");
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000), now)).toBe("3 h ago");
    expect(timeAgo(new Date(now.getTime() - 2 * 86_400_000), now)).toBe("2 d ago");
    expect(timeAgo(new Date("2026-08-01T00:00:00Z"), now)).toMatch(/Aug 1, 2026/);
    expect(timeAgo(new Date(now.getTime() + 60_000), now)).toBe("just now");
  });

  it("uses Philippine time", () => {
    expect(formatDateTime(new Date("2026-10-29T01:05:00Z"))).toMatch(/Oct 29, 2026.*9:05/);
  });

  it("makes initials from the first two names", () => {
    expect(initials("Ana Reyes Cruz")).toBe("AR");
    expect(initials("  ñoño ")).toBe("Ñ");
    expect(initials("")).toBe("");
  });

  it("formats file sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(340 * 1024)).toBe("340 KB");
    expect(formatBytes(1.25 * 1024 * 1024)).toBe("1.3 MB");
  });

  it("formats video lengths", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(102)).toBe("1:42");
    expect(formatDuration(180)).toBe("3:00");
    expect(formatDuration(59.6)).toBe("1:00");
  });
});
