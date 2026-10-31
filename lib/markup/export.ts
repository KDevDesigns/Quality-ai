import { IMAGE_MAX_BYTES } from "@/lib/uploads/limits";

// Saving a screenshot for upload, at its full size so small ERP text stays readable. WebP at high quality is usually a
// fraction of the PNG's size with no visible difference; browsers that can't write WebP (older Safari) use JPEG. PNG is
// kept when it comes out smaller, which happens with plain, mostly empty screens.

export const LOSSY_QUALITY = 0.92;

export type OutputFormat = { mime: "image/png" | "image/jpeg" | "image/webp"; ext: "png" | "jpg" | "webp" };

export const PNG: OutputFormat = { mime: "image/png", ext: "png" };
export const JPEG: OutputFormat = { mime: "image/jpeg", ext: "jpg" };
export const WEBP: OutputFormat = { mime: "image/webp", ext: "webp" };

/** Images this small are left as they are: converting them saves next to nothing. */
export const CONVERT_ABOVE_BYTES = 200 * 1024;

/** The smallest of the encodings that fits the upload limit, or null when none does. */
export function pickSmallest<T extends { size: number }>(options: T[], limit = IMAGE_MAX_BYTES): T | null {
  const fitting = options.filter((o) => o.size <= limit);
  return fitting.length ? fitting.reduce((a, b) => (b.size < a.size ? b : a)) : null;
}

/** A converted copy replaces the person's file only when it is at least 10% smaller. */
export const worthReplacing = (originalBytes: number, convertedBytes: number) => convertedBytes < originalBytes * 0.9;

const baseName = (original: string) => original.replace(/\.[a-z0-9]+$/i, "").replace(/-marked$/, "");

/** "screenshot-2026-10-31.png" → "screenshot-2026-10-31-marked.webp". */
export function markedName(original: string, format: OutputFormat): string {
  return `${baseName(original) || "screenshot"}-marked.${format.ext}`;
}

/** "screenshot-2026-10-31.png" → "screenshot-2026-10-31.webp": the same picture, saved smaller. */
export function convertedName(original: string, format: OutputFormat): string {
  return `${original.replace(/\.[a-z0-9]+$/i, "") || "screenshot"}.${format.ext}`;
}
