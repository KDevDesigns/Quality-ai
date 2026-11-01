import { clampFont, drawOrderIndexes, fontOf, normalizeRect, type Point, type Rect, type Shape } from "./shapes";

// Selecting, moving and resizing marks with the Select tool. Text widths come from `measure`, which is the canvas in the
// browser (lib/markup/draw.ts) and a simple estimate in tests. All in image pixels.

/** How wide `text` is at `fontPx`. */
export type Measure = (text: string, fontPx: number) => number;

/** A rough width for tests and for the moments before a canvas exists. */
export const estimateWidth: Measure = (text, fontPx) => text.length * fontPx * 0.6;

/** Line height of notes and callouts, as a multiple of the font size. */
export const LINE = 1.2;

/** A step's circle radius for its font size. */
export const stepRadius = (fontPx: number) => fontPx * 0.95;

/** The note box of a callout: its text plus padding. */
export function calloutBox(s: Extract<Shape, { kind: "callout" }>, imageWidth: number, measure: Measure): Rect {
  const fs = fontOf(s, imageWidth);
  const pad = fs * 0.45;
  return { x: s.at.x, y: s.at.y, w: measure(s.text, fs) + pad * 2, h: fs * LINE + pad * 2 };
}

const rectAround = (points: Point[]): Rect => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return normalizeRect({ x: Math.min(...xs), y: Math.min(...ys) }, { x: Math.max(...xs), y: Math.max(...ys) });
};

/** The smallest rectangle around a mark. */
export function bounds(s: Shape, imageWidth: number, measure: Measure = estimateWidth): Rect {
  switch (s.kind) {
    case "box":
    case "ellipse":
    case "highlight":
    case "hide":
    case "crop":
      return s.rect;
    case "arrow":
      return rectAround([s.from, s.to]);
    case "pen":
      return rectAround(s.points);
    case "text": {
      const fs = fontOf(s, imageWidth);
      return { x: s.at.x, y: s.at.y, w: Math.max(fs, measure(s.text, fs)), h: fs * LINE };
    }
    case "step": {
      const r = stepRadius(fontOf(s, imageWidth));
      return { x: s.at.x - r, y: s.at.y - r, w: r * 2, h: r * 2 };
    }
    case "callout": {
      const b = calloutBox(s, imageWidth, measure);
      return rectAround([{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, s.tip]);
    }
  }
}

const inside = (p: Point, r: Rect, tol: number) => p.x >= r.x - tol && p.x <= r.x + r.w + tol && p.y >= r.y - tol && p.y <= r.y + r.h + tol;

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * The mark under `p`, as an index into `shapes`, or -1. The one drawn on top wins. Lines and pen strokes are hit near
 * the line; everything else anywhere inside its frame. Crops aren't marks and can't be picked.
 */
export function hitTest(shapes: Shape[], p: Point, imageWidth: number, tolerance: number, measure: Measure = estimateWidth): number {
  const order = drawOrderIndexes(shapes);
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k];
    const s = shapes[i];
    if (s.kind === "arrow" ? distToSegment(p, s.from, s.to) <= tolerance : s.kind === "pen" ? s.points.some((q, j) => j > 0 && distToSegment(p, s.points[j - 1], q) <= tolerance) : inside(p, bounds(s, imageWidth, measure), tolerance)) {
      return i;
    }
  }
  return -1;
}

/** Corner handles of rectangles, the two ends of an arrow, a size corner on notes, steps and pen strokes, a callout's tip. */
export type Handle = "nw" | "ne" | "sw" | "se" | "from" | "to" | "scale" | "tip";

export function handlesOf(s: Shape, imageWidth: number, measure: Measure = estimateWidth): { id: Handle; at: Point }[] {
  switch (s.kind) {
    case "box":
    case "ellipse":
    case "highlight":
    case "hide":
    case "crop": {
      const r = s.rect;
      return [
        { id: "nw", at: { x: r.x, y: r.y } },
        { id: "ne", at: { x: r.x + r.w, y: r.y } },
        { id: "sw", at: { x: r.x, y: r.y + r.h } },
        { id: "se", at: { x: r.x + r.w, y: r.y + r.h } },
      ];
    }
    case "arrow":
      return [
        { id: "from", at: s.from },
        { id: "to", at: s.to },
      ];
    case "pen":
    case "text":
    case "step": {
      const b = bounds(s, imageWidth, measure);
      return [{ id: "scale", at: { x: b.x + b.w, y: b.y + b.h } }];
    }
    case "callout": {
      const b = calloutBox(s, imageWidth, measure);
      return [
        { id: "scale", at: { x: b.x + b.w, y: b.y + b.h } },
        { id: "tip", at: s.tip },
      ];
    }
  }
}

/** The handle under `p`, if any. */
export function handleAt(s: Shape, p: Point, imageWidth: number, tolerance: number, measure: Measure = estimateWidth): Handle | null {
  return handlesOf(s, imageWidth, measure).find((h) => Math.hypot(h.at.x - p.x, h.at.y - p.y) <= tolerance)?.id ?? null;
}

const shift = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });

export function move(s: Shape, dx: number, dy: number): Shape {
  switch (s.kind) {
    case "box":
    case "ellipse":
    case "highlight":
    case "hide":
    case "crop":
      return { ...s, rect: { ...s.rect, x: s.rect.x + dx, y: s.rect.y + dy } };
    case "arrow":
      return { ...s, from: shift(s.from, dx, dy), to: shift(s.to, dx, dy) };
    case "pen":
      return { ...s, points: s.points.map((p) => shift(p, dx, dy)) };
    case "text":
    case "step":
      return { ...s, at: shift(s.at, dx, dy) };
    case "callout":
      return { ...s, at: shift(s.at, dx, dy), tip: shift(s.tip, dx, dy) };
  }
}

const opposite: Record<"nw" | "ne" | "sw" | "se", (r: Rect) => Point> = {
  nw: (r) => ({ x: r.x + r.w, y: r.y + r.h }),
  ne: (r) => ({ x: r.x, y: r.y + r.h }),
  sw: (r) => ({ x: r.x + r.w, y: r.y }),
  se: (r) => ({ x: r.x, y: r.y }),
};

/**
 * `start` as it was when the drag began, reshaped by dragging `handle` to `p`. Rectangles keep the opposite corner
 * fixed (dragging past it flips them); text, steps and callouts grow or shrink their font with the drag; pen strokes
 * scale from their top-left corner.
 */
export function resize(start: Shape, handle: Handle, p: Point, imageWidth: number, measure: Measure = estimateWidth): Shape {
  switch (start.kind) {
    case "box":
    case "ellipse":
    case "highlight":
    case "hide":
    case "crop":
      if (handle === "nw" || handle === "ne" || handle === "sw" || handle === "se") return { ...start, rect: normalizeRect(opposite[handle](start.rect), p) };
      return start;
    case "arrow":
      if (handle === "from") return { ...start, from: p };
      if (handle === "to") return { ...start, to: p };
      return start;
    case "pen": {
      const b = bounds(start, imageWidth, measure);
      const sx = b.w ? Math.max(4, p.x - b.x) / b.w : 1;
      const sy = b.h ? Math.max(4, p.y - b.y) / b.h : 1;
      return { ...start, points: start.points.map((q) => ({ x: b.x + (q.x - b.x) * sx, y: b.y + (q.y - b.y) * sy })) };
    }
    case "text":
    case "step":
    case "callout": {
      if (start.kind === "callout" && handle === "tip") return { ...start, tip: p };
      if (handle !== "scale") return start;
      const b = start.kind === "callout" ? calloutBox(start, imageWidth, measure) : bounds(start, imageWidth, measure);
      return { ...start, fontPx: clampFont(fontOf(start, imageWidth) * (Math.max(1, p.y - b.y) / b.h)) };
    }
  }
}
