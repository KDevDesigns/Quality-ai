import { describe, expect, it } from "vitest";
import { DRAFT_MAX_AGE_MS, draftKey, filingMark, guessDevice, isDeviceType, isEmptyDraft, isOwnFiling, parseDraft, removeAllDrafts } from "@/lib/tickets/draft";

const now = 1_800_000_000_000;
const file = { id: "u1", kind: "IMAGE", name: "shot.png", size: 10, durationSec: null, uploadedAt: now - 1000 };
const raw = (over: object = {}) => JSON.stringify({ savedAt: now - 1000, fields: { title: "Wrong total" }, files: [], ...over });

describe("ticket drafts", () => {
  it("are kept per person", () => {
    expect(draftKey("a")).not.toBe(draftKey("b"));
  });

  it("reads back what was saved, keeping only known fields", () => {
    const d = parseDraft(raw({ fields: { title: "Wrong total", password: "x", priority: 3 }, files: [file] }), now);
    expect(d?.fields).toEqual({ title: "Wrong total" });
    expect(d?.files).toEqual([file]);
  });

  it("expires after a day", () => {
    expect(parseDraft(raw({ savedAt: now - DRAFT_MAX_AGE_MS + 1 }), now)).not.toBeNull();
    expect(parseDraft(raw({ savedAt: now - DRAFT_MAX_AGE_MS - 1 }), now)).toBeNull();
  });

  it("ignores missing, broken and empty drafts", () => {
    expect(parseDraft(null, now)).toBeNull();
    expect(parseDraft("{not json", now)).toBeNull();
    expect(parseDraft(JSON.stringify({ fields: {}, files: [] }), now)).toBeNull();
    expect(parseDraft(raw({ fields: { type: "BUG", title: "  " } }), now)).toBeNull();
  });

  it("drops files it can't read", () => {
    const d = parseDraft(raw({ files: [file, { id: 3 }, null] }), now);
    expect(d?.files).toEqual([file]);
  });

  it("drops a file whose upload has expired, even if the draft was saved since", () => {
    const old = { ...file, id: "old", uploadedAt: now - DRAFT_MAX_AGE_MS - 1 };
    expect(parseDraft(raw({ files: [old, file] }), now)?.files).toEqual([file]);
    expect(parseDraft(raw({ fields: {}, files: [old] }), now)).toBeNull();
  });

  it("removes every draft on sign-out, and nothing else", () => {
    const data = new Map([[draftKey("a"), "x"], [draftKey("b"), "y"], ["qa-hub:device-type", "ANDROID"]]);
    removeAllDrafts({ get length() { return data.size; }, key: (i) => [...data.keys()][i] ?? null, removeItem: (k) => void data.delete(k) });
    expect([...data.keys()]).toEqual(["qa-hub:device-type"]);
  });

  it("counts only what the person wrote or attached", () => {
    expect(isEmptyDraft({ fields: { type: "BUG", priority: "P3" }, files: [] })).toBe(true);
    expect(isEmptyDraft({ fields: { description: "Steps" }, files: [] })).toBe(false);
    expect(isEmptyDraft({ fields: {}, files: [file as never] })).toBe(false);
  });
});

describe("filing marks", () => {
  it("accepts only a plain mark, since it goes into the address", () => {
    expect(filingMark("abc123")).toBe("abc123");
    expect(filingMark("../evil")).toBeNull();
    expect(filingMark("a&b=c")).toBeNull();
    expect(filingMark("")).toBeNull();
    expect(filingMark(null)).toBeNull();
    expect(filingMark("x".repeat(41))).toBeNull();
  });

  it("recognises only this tab's own filing", () => {
    expect(isOwnFiling("abc", "abc")).toBe(true);
    // A copied link, Back after the mark was used, or no mark at all.
    expect(isOwnFiling("abc", "other")).toBe(false);
    expect(isOwnFiling("abc", null)).toBe(false);
    expect(isOwnFiling(null, null)).toBe(false);
  });
});

describe("guessDevice", () => {
  it("tells phones, tablets and computers apart", () => {
    expect(guessDevice("Mozilla/5.0 (Linux; Android 14; SM-A155F) Chrome/120 Mobile Safari/537", 5)).toBe("ANDROID");
    expect(guessDevice("Mozilla/5.0 (Linux; Android 14; SM-X110) Chrome/120 Safari/537", 5)).toBe("TABLET");
    expect(guessDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5)).toBe("IPHONE");
    expect(guessDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("TABLET");
    expect(guessDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe("COMPUTER");
    expect(guessDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 0)).toBe("COMPUTER");
  });

  it("checks a remembered value", () => {
    expect(isDeviceType("ANDROID")).toBe(true);
    expect(isDeviceType("TOASTER")).toBe(false);
    expect(isDeviceType(null)).toBe(false);
  });
});
