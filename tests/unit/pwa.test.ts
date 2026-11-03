import { describe, expect, it, vi } from "vitest";
import { isInstalled, isIos, isWindows, showBadge } from "@/lib/pwa";

const device = (userAgent: string, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });

describe("isIos", () => {
  it("knows iPhones and iPads", () => {
    expect(isIos(device("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5))).toBe(true);
    expect(isIos(device("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)", 5))).toBe(true);
  });

  it("knows an iPad that calls itself a Mac, by its touch screen", () => {
    expect(isIos(device("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5))).toBe(true);
    expect(isIos(device("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0))).toBe(false);
  });

  it("isn't fooled by Android or Windows", () => {
    expect(isIos(device("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5))).toBe(false);
    expect(isIos(device("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))).toBe(false);
  });
});

describe("isWindows", () => {
  it("knows Windows from other systems", () => {
    expect(isWindows(device("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))).toBe(true);
    expect(isWindows(device("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5))).toBe(false);
  });
});

describe("showBadge", () => {
  const nav = () => ({ setAppBadge: vi.fn(async () => {}), clearAppBadge: vi.fn(async () => {}) });

  it("shows the count, and clears the icon at zero", () => {
    const n = nav();
    showBadge(3, n);
    expect(n.setAppBadge).toHaveBeenCalledWith(3);
    showBadge(0, n);
    expect(n.clearAppBadge).toHaveBeenCalledOnce();
  });

  it("does nothing in a browser without badges, and ignores a refusal", async () => {
    expect(() => showBadge(3, {})).not.toThrow();
    const refused = { setAppBadge: vi.fn(async () => Promise.reject(new Error("not installed"))) };
    expect(() => showBadge(3, refused)).not.toThrow();
    await Promise.resolve();
  });
});

describe("isInstalled", () => {
  const win = (standaloneMode: boolean, standalone?: boolean) => ({
    matchMedia: () => ({ matches: standaloneMode }),
    navigator: { ...device(""), standalone },
  });

  it("is true when opened from its icon", () => {
    expect(isInstalled(win(true))).toBe(true);
    expect(isInstalled(win(false, true))).toBe(true);
  });

  it("is false in a browser tab", () => {
    expect(isInstalled(win(false))).toBe(false);
    expect(isInstalled(win(false, false))).toBe(false);
  });
});
