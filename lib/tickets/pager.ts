// The numbered pager under a list: which page numbers to show, with gaps ("…") when there are many. Pure, unit-tested.

export type PagerItem = number | "gap";

/**
 * The pages to show for page `page` of `pages`: always the first and last, and the current one with one neighbour on
 * each side. A gap of a single page shows that page instead of "…". Empty for a single page (the pager is hidden).
 */
export function pageList(page: number, pages: number): PagerItem[] {
  if (pages <= 1) return [];
  const p = Math.min(Math.max(1, page), pages);
  const keep = new Set([1, pages, p - 1, p, p + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: PagerItem[] = [];
  for (const n of sorted) {
    const prev = out.at(-1);
    if (typeof prev === "number" && n - prev === 2) out.push(prev + 1);
    else if (typeof prev === "number" && n - prev > 2) out.push("gap");
    out.push(n);
  }
  return out;
}
