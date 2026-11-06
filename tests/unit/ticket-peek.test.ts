import { describe, expect, it } from "vitest";
import { opensPeek, peekHref, type PeekClick } from "@/lib/tickets/peek";

const plain: PeekClick = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };

describe("peekHref", () => {
  it("is the ticket's own URL with /peek after it", () => {
    expect(peekHref(128)).toBe("/tickets/128/peek");
  });
});

describe("opensPeek", () => {
  it("opens the panel for a plain click on a laptop", () => {
    expect(opensPeek(plain, true)).toBe(true);
  });

  it("goes to the ticket page on a phone", () => {
    expect(opensPeek(plain, false)).toBe(false);
  });

  it("leaves a new-tab or new-window click to the browser", () => {
    for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(opensPeek({ ...plain, [key]: true }, true)).toBe(false);
    }
    expect(opensPeek({ ...plain, button: 1 }, true)).toBe(false);
  });

  it("does nothing when something else already handled the click", () => {
    expect(opensPeek({ ...plain, defaultPrevented: true }, true)).toBe(false);
  });
});
