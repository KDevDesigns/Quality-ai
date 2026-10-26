import { describe, expect, it } from "vitest";
import { buildHeatMap, riskBand, riskScore } from "@/lib/risk/score";

describe("riskScore", () => {
  it("multiplies likelihood by impact", () => {
    expect(riskScore(1, 1)).toBe(1);
    expect(riskScore(3, 4)).toBe(12);
    expect(riskScore(5, 5)).toBe(25);
  });

  it.each([[0, 3], [6, 1], [2.5, 2], [Number.NaN, 1]])("rejects out-of-range input (%s, %s)", (l, i) => {
    expect(() => riskScore(l, i)).toThrow(RangeError);
  });
});

describe("riskBand", () => {
  it.each([
    [1, "low"], [4, "low"],
    [5, "medium"], [9, "medium"],
    [10, "high"], [12, "high"],
    [15, "critical"], [25, "critical"],
  ] as const)("score %i -> %s", (score, band) => {
    expect(riskBand(score)).toBe(band);
  });
});

describe("buildHeatMap", () => {
  const map = buildHeatMap([
    { id: "a", likelihood: 5, impact: 5 },
    { id: "b", likelihood: 5, impact: 5 },
    { id: "c", likelihood: 1, impact: 1 },
    { id: "d", likelihood: 2, impact: 4 },
  ]);

  it("is 5x5 with likelihood 5 on top and impact 1 on the left", () => {
    expect(map).toHaveLength(5);
    map.forEach((row) => expect(row).toHaveLength(5));
    expect(map[0][0]).toMatchObject({ likelihood: 5, impact: 1 });
    expect(map[4][4]).toMatchObject({ likelihood: 1, impact: 5 });
  });

  it("places risks in the right cells", () => {
    expect(map[0][4].riskIds).toEqual(["a", "b"]);
    expect(map[4][0].riskIds).toEqual(["c"]);
    expect(map[3][3].riskIds).toEqual(["d"]);
    expect(map[0][4].band).toBe("critical");
  });

  it("ignores out-of-range risks rather than crashing", () => {
    expect(() => buildHeatMap([{ id: "x", likelihood: 9, impact: 0 }])).not.toThrow();
  });
});
