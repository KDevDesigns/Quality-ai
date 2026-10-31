// Screenshot markup (Phase 3.8): what can be drawn on an image, in the image's own pixels. Framework-free, so the
// geometry is tested without a browser; app/(main)/tickets/markup draws it on a canvas.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export const TOOLS = ["box", "arrow", "pen", "text", "hide", "crop"] as const;
export type Tool = (typeof TOOLS)[number];

export type Shape =
  | { kind: "box"; rect: Rect; color: string }
  | { kind: "arrow"; from: Point; to: Point; color: string }
  | { kind: "pen"; points: Point[]; color: string }
  | { kind: "text"; at: Point; text: string; color: string; size?: TextSize }
  /** A solid black box. Never a blur: blurred or pixelated text can be read back by de-pixelation tools. */
  | { kind: "hide"; rect: Rect }
  | { kind: "crop"; rect: Rect };

/** A rectangle from two corners dragged in any direction. */
export function normalizeRect(a: Point, b: Point): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

/** Keeps a rectangle inside the image; null when nothing of it is left. */
export function clampRect(r: Rect, size: { w: number; h: number }): Rect | null {
  const x = Math.max(0, Math.min(r.x, size.w));
  const y = Math.max(0, Math.min(r.y, size.h));
  const w = Math.min(r.x + r.w, size.w) - x;
  const h = Math.min(r.y + r.h, size.h) - y;
  return w >= 1 && h >= 1 ? { x, y, w, h } : null;
}

/** Line width for an image of this width, so marks look the same on a laptop screenshot and a 4K one. */
export function strokeFor(imageWidth: number): number {
  return Math.max(3, Math.round(imageWidth / 400));
}

/** Text size that goes with strokeFor (the Small size). */
export function fontSizeFor(imageWidth: number): number {
  return Math.max(16, Math.round(imageWidth / 70));
}

/** Text sizes to pick from, as a multiple of fontSizeFor. Medium is the default. */
export const TEXT_SIZES = [
  { id: "S", label: "Small", factor: 1 },
  { id: "M", label: "Medium", factor: 1.6 },
  { id: "L", label: "Large", factor: 2.4 },
  { id: "XL", label: "Extra large", factor: 3.4 },
] as const;
export type TextSize = (typeof TEXT_SIZES)[number]["id"];
export const DEFAULT_TEXT_SIZE: TextSize = "M";

/** The text's height in image pixels. Notes saved before sizes existed have none and keep the Small size. */
export function textFontSize(imageWidth: number, size: TextSize | undefined): number {
  const factor = TEXT_SIZES.find((s) => s.id === size)?.factor ?? 1;
  return Math.round(fontSizeFor(imageWidth) * factor);
}

/** The two back corners of an arrow head at `to`, pointing away from `from`. */
export function arrowHead(from: Point, to: Point, size: number): [Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = Math.PI / 7;
  return [
    { x: to.x - size * Math.cos(angle - spread), y: to.y - size * Math.sin(angle - spread) },
    { x: to.x - size * Math.cos(angle + spread), y: to.y - size * Math.sin(angle + spread) },
  ];
}

/** Too small to be meant (a click rather than a drag); such shapes are dropped instead of added. */
export function isTiny(s: Shape): boolean {
  switch (s.kind) {
    case "box":
    case "hide":
    case "crop":
      return s.rect.w < 4 || s.rect.h < 4;
    case "arrow":
      return Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) < 6;
    case "pen":
      return s.points.length < 2;
    case "text":
      return !s.text.trim();
  }
}

/** The crop in effect: the last one drawn, kept inside the image. The whole image when there is none. */
export function cropOf(shapes: Shape[], size: { w: number; h: number }): Rect {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.kind === "crop") return clampRect(s.rect, size) ?? { x: 0, y: 0, ...size };
  }
  return { x: 0, y: 0, ...size };
}

/**
 * Drawing order: marks first, then every hidden area on top, so nothing drawn later can show through a black box.
 * Crops aren't drawn; they decide what is kept.
 */
export function drawOrder(shapes: Shape[]): Shape[] {
  return [...shapes.filter((s) => s.kind !== "hide" && s.kind !== "crop"), ...shapes.filter((s) => s.kind === "hide")];
}
