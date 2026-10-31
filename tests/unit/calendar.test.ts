import { describe, expect, it } from "vitest";
import { addDays, addMonths, monthGrid, parseIsoDate, todayInManila } from "@/lib/calendar";
import { ampm, hhmm, timeOptions } from "@/lib/time-options";

describe("date picker calendar", () => {
  it("lays a month out in six Sunday-first weeks", () => {
    const nov = monthGrid(2026, 11); // Nov 1, 2026 is a Sunday
    expect(nov).toHaveLength(42);
    expect(nov[0]).toEqual({ date: "2026-11-01", day: 1, inMonth: true });
    expect(nov[29]).toEqual({ date: "2026-11-30", day: 30, inMonth: true });
    expect(nov[30]).toEqual({ date: "2026-12-01", day: 1, inMonth: false });

    const oct = monthGrid(2026, 10); // Oct 1, 2026 is a Thursday
    expect(oct.slice(0, 4).map((d) => d.date)).toEqual(["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30"]);
    expect(oct[4]).toEqual({ date: "2026-10-01", day: 1, inMonth: true });
  });

  it("knows leap years", () => {
    expect(monthGrid(2028, 2).filter((d) => d.inMonth)).toHaveLength(29);
    expect(monthGrid(2026, 2).filter((d) => d.inMonth)).toHaveLength(28);
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("2028-02-29")).toEqual({ y: 2028, m: 2, d: 29 });
    expect(parseIsoDate("29/02/2028")).toBeNull();
  });

  it("moves across months and years", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ y: 2027, m: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ y: 2025, m: 12 });
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("uses Manila's date, not the computer's", () => {
    // 16:30 UTC on Oct 15 is already 00:30 on Oct 16 in Manila.
    expect(todayInManila(new Date("2026-10-15T16:30:00Z"))).toBe("2026-10-16");
  });
});

describe("work-hours times", () => {
  it("offers every half hour, labelled in AM and PM", () => {
    const opts = timeOptions();
    expect(opts).toHaveLength(48);
    expect(opts[0]).toEqual({ value: "00:00", label: "12:00 AM" });
    expect(opts[14]).toEqual({ value: "07:00", label: "7:00 AM" });
    expect(opts[24]).toEqual({ value: "12:00", label: "12:00 PM" });
    expect(opts[47]).toEqual({ value: "23:30", label: "11:30 PM" });
  });

  it("keeps a saved time that isn't on the half hour, in order", () => {
    const opts = timeOptions(30, 435); // 7:15
    expect(opts).toHaveLength(49);
    expect(opts.slice(14, 17).map((o) => o.value)).toEqual(["07:00", "07:15", "07:30"]);
    expect(timeOptions(30, 420)).toHaveLength(48);
  });

  it("formats minutes after midnight", () => {
    expect(hhmm(450)).toBe("07:30");
    expect(ampm(1080)).toBe("6:00 PM");
  });
});
