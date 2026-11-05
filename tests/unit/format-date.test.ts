import { describe, expect, it } from "vitest";
import { formatDate, formatLongDate, greeting } from "@/lib/format";

describe("greeting", () => {
  it("follows the time of day in Manila (UTC+8)", () => {
    expect(greeting(new Date("2026-11-04T23:30:00Z"))).toBe("Good morning"); // 7:30 AM
    expect(greeting(new Date("2026-11-05T04:00:00Z"))).toBe("Good afternoon"); // 12:00 PM
    expect(greeting(new Date("2026-11-05T09:59:00Z"))).toBe("Good afternoon"); // 5:59 PM
    expect(greeting(new Date("2026-11-05T10:00:00Z"))).toBe("Good evening"); // 6:00 PM
    expect(greeting(new Date("2026-11-05T15:59:00Z"))).toBe("Good evening"); // 11:59 PM
    expect(greeting(new Date("2026-11-05T16:00:00Z"))).toBe("Good morning"); // midnight
  });

  it("writes the long date in Manila", () => {
    expect(formatLongDate(new Date("2026-11-04T16:30:00Z"))).toMatch(/Thursday.*November.*5.*2026/);
  });
});

describe("formatDate", () => {
  it("shows the date in Manila, whatever the server's clock zone is", () => {
    expect(formatDate(new Date("2026-10-28T15:59:00Z"))).toBe("Oct 28, 2026");
    expect(formatDate(new Date("2026-10-28T16:00:00Z"))).toBe("Oct 29, 2026");
  });
});
