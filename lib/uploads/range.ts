// HTTP Range requests for /files/[id], so a video can be scrubbed without downloading all of it first.

export type ByteRange = { start: number; end: number }; // inclusive, like Content-Range

/**
 * Reads a `Range` header against a file of `size` bytes.
 * "full" means send the whole file (no header, a unit other than bytes, a malformed header or several ranges);
 * "unsatisfiable" means answer 416.
 */
export function parseRange(header: string | null, size: number): ByteRange | "full" | "unsatisfiable" {
  if (!header) return "full";
  const m = /^bytes=\s*(\d*)\s*-\s*(\d*)\s*$/.exec(header.trim());
  if (!m) return "full"; // includes multi-range ("bytes=0-1,5-6"): answering 200 is allowed and simpler
  const [, a, b] = m;
  if (a === "" && b === "") return "full";
  if (size === 0) return "unsatisfiable";

  if (a === "") {
    // Suffix: the last n bytes.
    const n = Number(b);
    if (n === 0) return "unsatisfiable";
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(a);
  if (start >= size) return "unsatisfiable";
  const end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  if (end < start) return "full";
  return { start, end };
}
