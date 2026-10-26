import Decimal from "decimal.js";
import prices from "@/data/model-prices.json";
import type { CloudModel } from "./tasks";

type Price = {
  inputPerMTok: string;
  outputPerMTok: string;
  longContextThreshold?: number;
  longInputPerMTok?: string;
  longOutputPerMTok?: string;
};

const PRICES = prices as unknown as Record<string, Price | string>;

export function priceFor(model: string): Price | null {
  const p = PRICES[model];
  return typeof p === "object" && p !== null ? p : null;
}

/** USD per million tokens times tokens equals micro-dollars, so no division is needed. */
export function costMicroUsd(model: CloudModel | string, usage: { inputTokens: number; outputTokens: number }): number {
  const p = priceFor(model);
  if (!p) return 0;
  const long = p.longContextThreshold !== undefined && usage.inputTokens > p.longContextThreshold;
  const inRate = long && p.longInputPerMTok ? p.longInputPerMTok : p.inputPerMTok;
  const outRate = long && p.longOutputPerMTok ? p.longOutputPerMTok : p.outputPerMTok;
  return new Decimal(usage.inputTokens)
    .mul(inRate)
    .plus(new Decimal(usage.outputTokens).mul(outRate))
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function usdToMicro(usd: number | string): number {
  return new Decimal(usd).mul(1_000_000).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function formatMicroUsd(micro: number): string {
  const usd = new Decimal(micro).div(1_000_000);
  return "$" + (usd.lt(0.01) && usd.gt(0) ? usd.toFixed(4) : usd.toFixed(2));
}

export function monthStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
