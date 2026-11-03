// Zooming the screenshot in the markup editor (Ctrl + mouse wheel, the − / + buttons). `scale` is screen pixels per
// image pixel. The image is centred in the stage while it is smaller than it, and scrolls once it is larger.

/** At most 400 % of the image's real size. */
export const ZOOM_MAX = 4;

/** Browsers refuse or blank very large canvases; the backing canvas stays under this many device pixels across. */
export const MAX_CANVAS_PX = 8192;

/** Each wheel notch or +/− press zooms by this much. */
export const ZOOM_STEP = 1.25;

/** The zoom range: from fitting the stage up to 400 %, never so large that the canvas gets too big. */
export function clampZoom(scale: number, fit: number, imageWidth: number, dpr = 1): number {
  const max = Math.max(fit, Math.min(ZOOM_MAX, MAX_CANVAS_PX / (imageWidth * dpr)));
  return Math.min(max, Math.max(fit, scale));
}

/** The image viewer's zoom: 1 is the image fitting the viewer, up to ZOOM_MAX times that. */
export function clampViewerZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(1, zoom));
}

/** One press of the image viewer's zoom buttons or keys. Stepping back lands on exactly 100 %, whatever rounding did. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const next = clampViewerZoom(direction > 0 ? zoom * ZOOM_STEP : zoom / ZOOM_STEP);
  return Math.abs(next - 1) < 0.01 ? 1 : next;
}

/** The zoom a two-finger pinch asks for: it follows how far the fingers have moved apart since they landed. */
export function pinchZoom(startScale: number, startDistance: number, distance: number): number {
  return startDistance > 0 ? startScale * (distance / startDistance) : startScale;
}

type Size = { w: number; h: number };
type Vec = { x: number; y: number };

/** Where the image starts inside the stage: centred while smaller, at 0 once it needs scrolling. */
const offset = (stage: number, content: number) => Math.max(0, (stage - content) / 2);

/**
 * The scroll position after zooming from `scale` to `next`, so the image point under `cursor` (in stage coordinates)
 * stays under the cursor.
 */
export function zoomAt(a: { scale: number; next: number; image: Size; stage: Size; scroll: Vec; cursor: Vec }): Vec {
  const axis = (key: "x" | "y", dim: "w" | "h") => {
    const before = offset(a.stage[dim], a.image[dim] * a.scale);
    const imagePoint = (a.scroll[key] + a.cursor[key] - before) / a.scale;
    const after = offset(a.stage[dim], a.image[dim] * a.next);
    const max = Math.max(0, a.image[dim] * a.next - a.stage[dim]);
    return Math.min(max, Math.max(0, imagePoint * a.next + after - a.cursor[key]));
  };
  return { x: axis("x", "w"), y: axis("y", "h") };
}
