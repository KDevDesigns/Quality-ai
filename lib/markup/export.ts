import { IMAGE_MAX_BYTES } from "@/lib/uploads/limits";

// Saving a marked-up image: PNG keeps text in screenshots sharp. A very large screenshot can come out over the image
// limit as PNG; then it is saved as JPEG instead.

export const JPEG_QUALITY = 0.9;

export type OutputFormat = { mime: "image/png" | "image/jpeg"; ext: "png" | "jpg" };

export const PNG: OutputFormat = { mime: "image/png", ext: "png" };
export const JPEG: OutputFormat = { mime: "image/jpeg", ext: "jpg" };

/** PNG unless the PNG came out larger than the upload limit. */
export function pickFormat(pngBytes: number, limit = IMAGE_MAX_BYTES): OutputFormat {
  return pngBytes > limit ? JPEG : PNG;
}

/** "screenshot-2026-10-31.png" → "screenshot-2026-10-31-marked.png" (or .jpg). */
export function markedName(original: string, format: OutputFormat): string {
  const base = original.replace(/\.[a-z0-9]+$/i, "").replace(/-marked$/, "");
  return `${base || "screenshot"}-marked.${format.ext}`;
}
