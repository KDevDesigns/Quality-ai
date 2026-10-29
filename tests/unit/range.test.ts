import { describe, expect, it } from "vitest";
import { parseRange } from "@/lib/uploads/range";

describe("parseRange", () => {
  it("sends the whole file without a usable header", () => {
    expect(parseRange(null, 100)).toBe("full");
    expect(parseRange("", 100)).toBe("full");
    expect(parseRange("items=0-5", 100)).toBe("full");
    expect(parseRange("bytes=-", 100)).toBe("full");
    expect(parseRange("bytes=0-1,5-6", 100)).toBe("full");
    expect(parseRange("bytes=10-5", 100)).toBe("full");
  });

  it("reads start-end, open-ended and suffix ranges", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange("bytes=50-", 100)).toEqual({ start: 50, end: 99 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange(" bytes=0-0 ", 100)).toEqual({ start: 0, end: 0 });
  });

  it("refuses ranges past the end", () => {
    expect(parseRange("bytes=100-", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=200-300", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=-0", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=0-", 0)).toBe("unsatisfiable");
  });
});
