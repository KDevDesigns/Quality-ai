export const SCALE = [1, 2, 3, 4, 5] as const;

export type RiskBand = "low" | "medium" | "high" | "critical";

export function riskScore(likelihood: number, impact: number): number {
  for (const [label, v] of [["likelihood", likelihood], ["impact", impact]] as const) {
    if (!Number.isInteger(v) || v < 1 || v > 5) throw new RangeError(`${label} must be an integer 1-5, got ${v}`);
  }
  return likelihood * impact;
}

export function riskBand(score: number): RiskBand {
  if (score >= 15) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export type HeatCell = { likelihood: number; impact: number; score: number; band: RiskBand; riskIds: string[] };

/** rows[0] is likelihood 5 (top of the grid), columns go impact 1..5 left to right. */
export function buildHeatMap(risks: readonly { id: string; likelihood: number; impact: number }[]): HeatCell[][] {
  const rows = [...SCALE].reverse().map((l) =>
    SCALE.map((i): HeatCell => {
      const score = l * i;
      return { likelihood: l, impact: i, score, band: riskBand(score), riskIds: [] };
    }),
  );
  for (const r of risks) {
    rows[5 - r.likelihood]?.[r.impact - 1]?.riskIds.push(r.id);
  }
  return rows;
}
