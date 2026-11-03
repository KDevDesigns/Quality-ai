import { describe, expect, it } from "vitest";
import { swipeStep } from "@/lib/tickets/swipe";

describe("swipeStep", () => {
  it("moves to the next tab when the finger goes left, the previous when it goes right", () => {
    expect(swipeStep(-80, 5)).toBe(1);
    expect(swipeStep(80, -5)).toBe(-1);
  });

  it("ignores a short movement", () => {
    expect(swipeStep(-59, 0)).toBe(0);
    expect(swipeStep(59, 0)).toBe(0);
  });

  it("ignores scrolling the page, even with some sideways drift", () => {
    expect(swipeStep(-70, 200)).toBe(0);
    expect(swipeStep(70, 36)).toBe(0);
  });
});
