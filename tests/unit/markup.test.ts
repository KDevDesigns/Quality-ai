import { describe, expect, it } from "vitest";
import { pinchZoom } from "@/lib/markup/view";
import { CONVERT_ABOVE_BYTES, convertedName, JPEG, markedName, pickSmallest, PNG, WEBP, worthReplacing } from "@/lib/markup/export";
import { canRedo, canUndo, emptyHistory, push, redo, undo } from "@/lib/markup/history";
import { arrowHead, clampRect, cropOf, DEFAULT_TEXT_SIZE, drawOrder, fontSizeFor, isTiny, normalizeRect, strokeFor, TEXT_SIZES, textFontSize, type Shape } from "@/lib/markup/shapes";

const size = { w: 1000, h: 600 };

describe("markup shapes", () => {
  it("normalises a rectangle dragged in any direction", () => {
    expect(normalizeRect({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, w: 40, h: 60 });
  });

  it("keeps rectangles inside the image", () => {
    expect(clampRect({ x: -20, y: 550, w: 100, h: 100 }, size)).toEqual({ x: 0, y: 550, w: 80, h: 50 });
    expect(clampRect({ x: 1200, y: 0, w: 50, h: 50 }, size)).toBeNull();
  });

  it("scales lines with the image width", () => {
    expect(strokeFor(800)).toBe(3);
    expect(strokeFor(3840)).toBe(10);
  });

  it("sizes text from the image width and the picked size, Medium by default", () => {
    expect(DEFAULT_TEXT_SIZE).toBe("M");
    expect(textFontSize(2560, "S")).toBe(fontSizeFor(2560));
    expect(textFontSize(2560, "M")).toBe(59);
    expect(textFontSize(2560, "XL")).toBeGreaterThan(textFontSize(2560, "L"));
    // Notes drawn before sizes existed keep their old size.
    expect(textFontSize(2560, undefined)).toBe(fontSizeFor(2560));
    expect(TEXT_SIZES.map((s) => s.id)).toEqual(["S", "M", "L", "XL"]);
  });

  it("points the arrow head back along the line", () => {
    const [a, b] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 20);
    expect(a.x).toBeLessThan(100);
    expect(b.x).toBeLessThan(100);
    expect(a.y).toBeCloseTo(-b.y);
  });

  it("drops clicks that weren't meant as drags", () => {
    expect(isTiny({ kind: "box", rect: { x: 0, y: 0, w: 2, h: 50 }, color: "#000" })).toBe(true);
    expect(isTiny({ kind: "text", at: { x: 0, y: 0 }, text: "  ", color: "#000" })).toBe(true);
    expect(isTiny({ kind: "arrow", from: { x: 0, y: 0 }, to: { x: 30, y: 40 }, color: "#000" })).toBe(false);
  });

  it("uses the last crop, kept inside the image", () => {
    const shapes: Shape[] = [
      { kind: "crop", rect: { x: 0, y: 0, w: 10, h: 10 } },
      { kind: "crop", rect: { x: 900, y: 500, w: 300, h: 300 } },
    ];
    expect(cropOf(shapes, size)).toEqual({ x: 900, y: 500, w: 100, h: 100 });
    expect(cropOf([], size)).toEqual({ x: 0, y: 0, w: 1000, h: 600 });
  });

  it("draws hidden areas over every mark, and never draws crops", () => {
    const hide: Shape = { kind: "hide", rect: { x: 0, y: 0, w: 50, h: 50 } };
    const pen: Shape = { kind: "pen", points: [{ x: 1, y: 1 }, { x: 9, y: 9 }], color: "#e5251b" };
    const crop: Shape = { kind: "crop", rect: { x: 0, y: 0, w: 500, h: 500 } };
    expect(drawOrder([hide, pen, crop])).toEqual([pen, hide]);
  });
});

describe("pinchZoom", () => {
  it("follows the fingers", () => {
    expect(pinchZoom(0.5, 100, 200)).toBe(1);
    expect(pinchZoom(1, 200, 100)).toBe(0.5);
    expect(pinchZoom(0.8, 150, 150)).toBe(0.8);
  });

  it("ignores fingers that landed on the same spot", () => {
    expect(pinchZoom(0.5, 0, 200)).toBe(0.5);
  });
});

describe("markup history", () => {
  it("undoes and redoes, and a new change clears what was undone", () => {
    let h = push(push(emptyHistory<number>(), [1]), [1, 2]);
    h = undo(h);
    expect(h.present).toEqual([1]);
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present).toEqual([1, 2]);
    h = push(undo(h), [1, 3]);
    expect(canRedo(h)).toBe(false);
    expect(undo(undo(undo(h))).present).toEqual([]);
    expect(canUndo(emptyHistory())).toBe(false);
  });
});

describe("markup export", () => {
  it("picks the smallest encoding that fits the upload limit", () => {
    const webp = { format: WEBP, size: 400_000 };
    const png = { format: PNG, size: 2_600_000 };
    expect(pickSmallest([webp, png], 10_000_000)).toBe(webp);
    // A plain, mostly empty screen can come out smaller as PNG.
    expect(pickSmallest([{ format: WEBP, size: 90_000 }, { format: PNG, size: 60_000 }], 10_000_000)?.format).toBe(PNG);
    expect(pickSmallest([{ format: JPEG, size: 11_000_000 }, { format: PNG, size: 30_000_000 }], 10_000_000)).toBeNull();
  });

  it("replaces the person's file only for a real saving", () => {
    expect(worthReplacing(2_600_000, 400_000)).toBe(true);
    expect(worthReplacing(300_000, 290_000)).toBe(false);
    expect(CONVERT_ABOVE_BYTES).toBeGreaterThan(0);
  });

  it("names the marked-up and converted files after the original", () => {
    expect(markedName("screenshot-2026-10-31.png", WEBP)).toBe("screenshot-2026-10-31-marked.webp");
    expect(markedName("shot-marked.png", JPEG)).toBe("shot-marked.jpg");
    expect(markedName(".png", PNG)).toBe("screenshot-marked.png");
    expect(convertedName("screenshot-2026-10-31.png", WEBP)).toBe("screenshot-2026-10-31.webp");
    expect(convertedName("IMG_0042.JPG", JPEG)).toBe("IMG_0042.jpg");
    expect(convertedName(".png", WEBP)).toBe("screenshot.webp");
  });
});
