import { describe, expect, it } from "vitest";
import { opensPeek, peekHref, ticketPageOf, wantsFullPage, type PeekClick } from "@/lib/tickets/peek";

const plain: PeekClick = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, detail: 1 };

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

  it("leaves a double-click to the link, which goes to the ticket page", () => {
    expect(opensPeek({ ...plain, detail: 2 }, true)).toBe(false);
    expect(opensPeek({ ...plain, detail: 3 }, true)).toBe(false);
  });

  it("opens the panel for Enter on a focused link", () => {
    expect(opensPeek({ ...plain, detail: 0 }, true)).toBe(true);
  });

  it("does nothing when something else already handled the click", () => {
    expect(opensPeek({ ...plain, defaultPrevented: true }, true)).toBe(false);
  });
});


describe("wantsFullPage", () => {
  it("sends a double-click's second click, which lands outside the panel, to the ticket page", () => {
    expect(wantsFullPage("outside-press", 2)).toBe(true);
  });

  it("lets a single click outside close the panel", () => {
    expect(wantsFullPage("outside-press", 1)).toBe(false);
  });

  it("never turns Esc or the X into the ticket page", () => {
    expect(wantsFullPage("escape-key", 0)).toBe(false);
    expect(wantsFullPage("close-press", 2)).toBe(false);
  });
});

describe("ticketPageOf", () => {
  it("gives the ticket page behind a panel URL", () => {
    expect(ticketPageOf("/tickets/29/peek")).toBe("/tickets/29");
    expect(ticketPageOf("/tickets/29/peek/")).toBe("/tickets/29");
  });

  it("gives null for anything else", () => {
    expect(ticketPageOf("/tickets")).toBeNull();
    expect(ticketPageOf("/tickets/29")).toBeNull();
    expect(ticketPageOf("/tickets/new/peek")).toBeNull();
  });
});
