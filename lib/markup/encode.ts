import { CONVERT_ABOVE_BYTES, convertedName, JPEG, LOSSY_QUALITY, PNG, pickSmallest, WEBP, worthReplacing, type OutputFormat } from "./export";

// The browser half of lib/markup/export.ts: encoding a canvas and converting a screenshot before it uploads. Smaller
// files mean less Storage space and less to download each time someone opens the ticket (Supabase Free: 1 GB stored,
// 5 GB downloaded a month).

type Encoded = { blob: Blob; format: OutputFormat; size: number };

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** WebP (or JPEG where the browser can't write WebP) and PNG; the smallest that fits the limit, or null. */
export async function encodeCanvas(canvas: HTMLCanvasElement): Promise<Encoded | null> {
  const options: Encoded[] = [];
  // A browser that can't write WebP quietly hands back a PNG instead.
  const webp = await toBlob(canvas, WEBP.mime, LOSSY_QUALITY);
  const lossy = webp?.type === WEBP.mime ? { blob: webp, format: WEBP } : await toBlob(canvas, JPEG.mime, LOSSY_QUALITY).then((b) => (b ? { blob: b, format: JPEG } : null));
  if (lossy) options.push({ ...lossy, size: lossy.blob.size });
  const png = await toBlob(canvas, PNG.mime);
  if (png) options.push({ blob: png, format: PNG, size: png.size });
  return pickSmallest(options);
}

/**
 * The same screenshot, same size, saved smaller; or the file itself when that saves little (small images, GIFs, which
 * may be animated) or the browser can't convert it. Never fails: the original always works as a fallback.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size <= CONVERT_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const out = await encodeCanvas(canvas);
    if (!out || !worthReplacing(file.size, out.size)) return file;
    return new File([out.blob], convertedName(file.name, out.format), { type: out.format.mime });
  } catch {
    return file;
  }
}
