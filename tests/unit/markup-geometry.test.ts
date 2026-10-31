import { describe, expect, it } from "vitest";
import { bounds, calloutBox, estimateWidth, handleAt, handlesOf, hitTest, move, resize, stepRadius } from "@/lib/markup/geometry";
import { drawOrder, fontOf, FONT_MAX, FONT_MIN, isTiny, nextStep, type Shape } from "@/lib/markup/shapes";
import { clampZoom, MAX_CANVAS_PX, ZOOM_MAX, zoomAt } from "@/lib/markup/view";

const W = 2560;
const red = "#e5251b";
const box: Shape = { kind: "box", rect: { x: 100, y: 100, w: 200, h: 100 }, color: red };
const note: Shape = { kind: "text", at: { x: 500, y: 500 }, text: "Wrong total", color: red, fontPx: 40 };
const hide: Shape = { kind: "hide", rect: { x: 120, y: 120, w: 50, h: 50 } };
const mark: Shape = { kind: "highlight", rect: { x: 0, y: 0, w: 1000, h: 1000 } };

describe("new markup tools", () => {
  it("numbers steps one after the highest so far", () => {
    expect(nextStep([])).toBe(1);
    expect(nextStep([box, { kind: "step", at: { x: 0, y: 0 }, n: 1, color: red }, { kind: "step", at: { x: 0, y: 0 }, n: 4, color: red }])).toBe(5);
  });

  it("draws highlights under everything and hidden areas over everything", () => {
    expect(drawOrder([hide, box, mark]).map((s) => s.kind)).toEqual(["highlight", "box", "hide"]);
  });

  it("drops empty or tiny new marks, but never a step", () => {
    expect(isTiny({ kind: "ellipse", rect: { x: 0, y: 0, w: 2, h: 40 }, color: red })).toBe(true);
    expect(isTiny({ kind: "callout", tip: { x: 0, y: 0 }, at: { x: 9, y: 9 }, text: " ", color: red })).toBe(true);
    expect(isTiny({ kind: "step", at: { x: 0, y: 0 }, n: 1, color: red })).toBe(false);
  });

  it("gives older notes their old size and new steps the Medium size", () => {
    expect(fontOf({ kind: "text", at: { x: 0, y: 0 }, text: "x", color: red }, W)).toBe(37);
    expect(fontOf({ kind: "step", at: { x: 0, y: 0 }, n: 1, color: red }, W)).toBe(59);
  });
});

describe("selecting marks", () => {
  it("frames each kind of mark", () => {
    expect(bounds(box, W)).toEqual(box.kind === "box" ? box.rect : null);
    expect(bounds(note, W)).toEqual({ x: 500, y: 500, w: estimateWidth("Wrong total", 40), h: 48 });
    const r = stepRadius(30);
    expect(bounds({ kind: "step", at: { x: 50, y: 50 }, n: 1, color: red, fontPx: 30 }, W)).toEqual({ x: 50 - r, y: 50 - r, w: 2 * r, h: 2 * r });
    const callout: Shape = { kind: "callout", tip: { x: 0, y: 0 }, at: { x: 100, y: 100 }, text: "Here", color: red, fontPx: 20 };
    const b = calloutBox(callout, W, estimateWidth);
    expect(bounds(callout, W)).toEqual({ x: 0, y: 0, w: b.x + b.w, h: b.y + b.h });
  });

  it("picks the mark on top, and hits lines only near the line", () => {
    const arrow: Shape = { kind: "arrow", from: { x: 0, y: 0 }, to: { x: 100, y: 100 }, color: red };
    const shapes = [mark, box, hide, arrow];
    expect(hitTest(shapes, { x: 130, y: 130 }, W, 4)).toBe(2); // the black box is drawn over the red one
    expect(hitTest(shapes, { x: 250, y: 150 }, W, 4)).toBe(1);
    expect(hitTest(shapes, { x: 51, y: 49 }, W, 4)).toBe(3);
    expect(hitTest(shapes, { x: 900, y: 900 }, W, 4)).toBe(0); // only the highlight is there
    expect(hitTest([box], { x: 900, y: 900 }, W, 4)).toBe(-1);
  });

  it("can't pick a crop", () => {
    expect(hitTest([{ kind: "crop", rect: { x: 0, y: 0, w: 100, h: 100 } }], { x: 50, y: 50 }, W, 4)).toBe(-1);
  });

  it("finds handles near the pointer", () => {
    expect(handlesOf(box, W).map((h) => h.id)).toEqual(["nw", "ne", "sw", "se"]);
    expect(handleAt(box, { x: 302, y: 199 }, W, 5)).toBe("se");
    expect(handleAt(box, { x: 200, y: 150 }, W, 5)).toBeNull();
  });
});

describe("moving and resizing marks", () => {
  it("moves every point of a mark", () => {
    expect(move(box, 10, -5)).toEqual({ ...box, rect: { x: 110, y: 95, w: 200, h: 100 } });
    const callout: Shape = { kind: "callout", tip: { x: 1, y: 2 }, at: { x: 3, y: 4 }, text: "x", color: red };
    expect(move(callout, 1, 1)).toMatchObject({ tip: { x: 2, y: 3 }, at: { x: 4, y: 5 } });
  });

  it("reshapes rectangles from a corner, flipping past the opposite one", () => {
    expect(resize(box, "se", { x: 400, y: 300 }, W)).toEqual({ ...box, rect: { x: 100, y: 100, w: 300, h: 200 } });
    expect(resize(box, "se", { x: 50, y: 50 }, W)).toEqual({ ...box, rect: { x: 50, y: 50, w: 50, h: 50 } });
  });

  it("makes text bigger or smaller by dragging its corner, within limits", () => {
    const bigger = resize(note, "scale", { x: 0, y: 500 + 96 }, W); // twice the height
    expect(bigger.kind === "text" && bigger.fontPx).toBe(80);
    const tiny = resize(note, "scale", { x: 0, y: 501 }, W);
    expect(tiny.kind === "text" && tiny.fontPx).toBe(FONT_MIN);
    const huge = resize(note, "scale", { x: 0, y: 99_999 }, W);
    expect(huge.kind === "text" && huge.fontPx).toBe(FONT_MAX);
  });

  it("moves a callout's arrow tip on its own", () => {
    const callout: Shape = { kind: "callout", tip: { x: 1, y: 2 }, at: { x: 50, y: 50 }, text: "x", color: red };
    expect(resize(callout, "tip", { x: 9, y: 9 }, W)).toMatchObject({ tip: { x: 9, y: 9 }, at: { x: 50, y: 50 } });
  });
});

describe("zooming the screenshot", () => {
  it("zooms between fitting the stage and 400 %, never past the largest canvas", () => {
    expect(clampZoom(0.1, 0.4, 1000)).toBe(0.4);
    expect(clampZoom(9, 0.4, 1000)).toBe(ZOOM_MAX);
    expect(clampZoom(9, 0.4, 2560, 2)).toBe(MAX_CANVAS_PX / (2560 * 2));
  });

  it("keeps the point under the cursor in place", () => {
    const image = { w: 2000, h: 1000 };
    const stage = { w: 800, h: 400 };
    const cursor = { x: 300, y: 100 };
    const scroll = { x: 200, y: 50 };
    const next = zoomAt({ scale: 1, next: 2, image, stage, scroll, cursor });
    // Image point under the cursor before: x (200 + 300) / 1 = 500, y (50 + 100) / 1 = 150.
    // At 2×: scroll x 500 * 2 - 300 = 700, y 150 * 2 - 100 = 200.
    expect(next).toEqual({ x: 700, y: 200 });
  });

  it("starts from a centred, fitted image", () => {
    // 2000 × 1000 fitted at 0.4 is 800 × 400: it fills the stage, no offset.
    const next = zoomAt({ scale: 0.4, next: 0.8, image: { w: 2000, h: 1000 }, stage: { w: 800, h: 600 }, scroll: { x: 0, y: 0 }, cursor: { x: 400, y: 300 } });
    // Vertically the 400 px image sat 100 px down, so the cursor (300 px down) was on image y = 500. Zoomed, that row is
    // 400 px from the top; scrolling 100 px keeps it under the cursor.
    expect(next).toEqual({ x: 400, y: 100 });
  });
});
