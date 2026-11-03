import { describe, expect, it } from "vitest";
import { checkUploaded, cleanOriginalName, isStoredName, planUpload, sniffImage, UploadError, type UploadedObject } from "@/lib/uploads/files";
import { IMAGE_MAX_BYTES, MOBILE_DATA_WARN_BYTES, VIDEO_MAX_BYTES, warnOnMobileData } from "@/lib/uploads/limits";
import { bufferReader } from "@/lib/uploads/video-meta";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);

const arrived = (bytes: Uint8Array, patch: Partial<UploadedObject> = {}): UploadedObject => ({
  kind: "IMAGE",
  storedName: "2026/10/" + "a".repeat(32) + ".png",
  originalName: "Bill.png",
  size: bytes.length,
  contentType: "image/png",
  read: bufferReader(bytes),
  ...patch,
});

describe("warnOnMobileData", () => {
  it("asks only for a big video on mobile data", () => {
    expect(warnOnMobileData(MOBILE_DATA_WARN_BYTES + 1, "cellular")).toBe(true);
    expect(warnOnMobileData(MOBILE_DATA_WARN_BYTES, "cellular")).toBe(false);
    expect(warnOnMobileData(MOBILE_DATA_WARN_BYTES + 1, "wifi")).toBe(false);
    expect(warnOnMobileData(MOBILE_DATA_WARN_BYTES + 1, undefined)).toBe(false);
  });
});

describe("sniffImage", () => {
  it("detects image types from the first bytes", () => {
    expect(sniffImage(PNG)?.mime).toBe("image/png");
    expect(sniffImage(JPEG)?.ext).toBe("jpg");
    expect(sniffImage(GIF)?.mime).toBe("image/gif");
    expect(sniffImage(WEBP)?.mime).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe("planUpload", () => {
  it("names the object by date and random id, never by the file name", () => {
    const p = planUpload({ kind: "IMAGE", name: "C:\\Users\\ana\\Desktop\\Bill 2026.png", type: "image/png", size: 1000 }, new Date(2026, 9, 29));
    expect(p).toMatchObject({ originalName: "Bill 2026.png", mime: "image/png" });
    expect(p.storedName).toMatch(/^2026\/10\/[a-f0-9]{32}\.png$/);
    expect(p.storedName).not.toContain("Bill");
    expect(planUpload({ kind: "VIDEO", name: "rec.webm", type: "video/webm", size: 10 }).storedName).toMatch(/\.webm$/);
  });

  it.each([
    ["an SVG", { kind: "IMAGE", name: "x.svg", type: "image/svg+xml", size: 10 }, /isn't a PNG/],
    ["HTML as an image", { kind: "IMAGE", name: "x.png", type: "text/html", size: 10 }, /isn't a PNG/],
    ["a video in the image picker", { kind: "IMAGE", name: "x.mp4", type: "video/mp4", size: 10 }, /isn't a PNG/],
    ["QuickTime", { kind: "VIDEO", name: "x.mov", type: "video/quicktime", size: 10 }, /isn't an MP4/],
    ["an empty file", { kind: "IMAGE", name: "x.png", type: "image/png", size: 0 }, /empty/],
    ["an oversize image", { kind: "IMAGE", name: "x.png", type: "image/png", size: IMAGE_MAX_BYTES + 1 }, /larger than 10 MB/],
    ["an oversize video", { kind: "VIDEO", name: "x.mp4", type: "video/mp4", size: VIDEO_MAX_BYTES + 1 }, /larger than/],
  ] as const)("refuses %s", (_l, input, msg) => {
    expect(() => planUpload(input)).toThrow(msg);
  });
});

describe("checkUploaded (images)", () => {
  it("accepts an image whose bytes, name and Content-Type agree", async () => {
    expect(await checkUploaded(arrived(PNG))).toEqual({ mime: "image/png", size: PNG.length, durationSec: null });
  });

  it("refuses bytes that aren't what the upload claimed", async () => {
    await expect(checkUploaded(arrived(new TextEncoder().encode("MZ fake exe")))).rejects.toThrow(UploadError);
    // A real JPEG uploaded under a .png name.
    await expect(checkUploaded(arrived(JPEG))).rejects.toThrow(/isn't a PNG/);
  });

  it("refuses a valid image served with another Content-Type, so it can't be opened as a page", async () => {
    await expect(checkUploaded(arrived(PNG, { contentType: "text/html" }))).rejects.toThrow(UploadError);
  });

  it("checks the size Storage reports, not the one the browser declared", async () => {
    await expect(checkUploaded(arrived(PNG, { size: 0 }))).rejects.toThrow(/empty/);
    await expect(checkUploaded(arrived(PNG, { size: IMAGE_MAX_BYTES + 1 }))).rejects.toThrow(/larger than/);
  });
});

describe("stored names", () => {
  it("only accepts names this module generates", () => {
    expect(isStoredName("2026/10/" + "a".repeat(32) + ".png")).toBe(true);
    for (const bad of ["../.env.local", "2026/10/../../x.png", "2026\\10\\" + "a".repeat(32) + ".png", "/etc/passwd", "2026/10/" + "a".repeat(32) + ".html", ""]) {
      expect(isStoredName(bad)).toBe(false);
    }
  });

  it("cleans display names", () => {
    expect(cleanOriginalName("../../secret/report<1>.png")).toBe("report1.png");
    expect(cleanOriginalName("a\u0000b.png")).toBe("ab.png");
    expect(cleanOriginalName("")).toBe("file");
    expect(cleanOriginalName("x".repeat(300))).toHaveLength(120);
  });
});
