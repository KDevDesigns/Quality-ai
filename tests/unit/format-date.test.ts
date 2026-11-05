import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("shows the date in Manila, whatever the server's clock zone is", () => {
    expect(formatDate(new Date("2026-10-28T15:59:00Z"))).toBe("Oct 28, 2026");
    expect(formatDate(new Date("2026-10-28T16:00:00Z"))).toBe("Oct 29, 2026");
  });
});
