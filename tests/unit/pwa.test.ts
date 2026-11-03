import { describe, expect, it } from "vitest";
import { isInstalled, isIos, isWindows } from "@/lib/pwa";

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
