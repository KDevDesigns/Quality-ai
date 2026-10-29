import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cleanOriginalName, IMAGE_MAX_BYTES, removeStored, resolveStored, saveImage, sniffImage, uploadDir, UploadError } from "@/lib/uploads/files";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);

const dir = mkdtempSync(path.join(tmpdir(), "qa-uploads-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("uploads", () => {
  it("detects image types from the first bytes", () => {
    expect(sniffImage(PNG)?.mime).toBe("image/png");
    expect(sniffImage(JPEG)?.ext).toBe("jpg");
    expect(sniffImage(GIF)?.mime).toBe("image/gif");
    expect(sniffImage(WEBP)?.mime).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0x89, 0x50]))).toBeNull();
  });

  it("saves under a generated name in a year/month folder", async () => {
    const saved = await saveImage(dir, PNG, "C:\\Users\\ana\\Desktop\\Bill 2026.png", new Date(2026, 9, 29));
    expect(saved).toMatchObject({ kind: "IMAGE", mime: "image/png", size: PNG.length, originalName: "Bill 2026.png" });
    expect(saved.storedName).toMatch(/^2026\/10\/[a-f0-9]{32}\.png$/);
    expect(saved.storedName).not.toContain("Bill");
    const file = resolveStored(dir, saved.storedName)!;
    expect(readFileSync(file)).toEqual(Buffer.from(PNG));

    await removeStored(dir, [saved]);
    expect(existsSync(file)).toBe(false);
  });

  it("uses the detected type, not the file name", async () => {
    const saved = await saveImage(dir, JPEG, "photo.png");
    expect(saved.mime).toBe("image/jpeg");
    expect(saved.storedName.endsWith(".jpg")).toBe(true);
  });

  it("rejects non-images, empty files and oversize files", async () => {
    await expect(saveImage(dir, new TextEncoder().encode("MZ fake exe"), "evil.png")).rejects.toThrow(UploadError);
    await expect(saveImage(dir, new Uint8Array(), "empty.png")).rejects.toThrow(/empty/);
    const big = new Uint8Array(IMAGE_MAX_BYTES + 1);
    big.set(PNG);
    await expect(saveImage(dir, big, "big.png")).rejects.toThrow(/larger than 10 MB/);
  });

  it("only resolves names it generated, so paths can't escape UPLOAD_DIR", () => {
    expect(resolveStored(dir, "2026/10/" + "a".repeat(32) + ".png")).toBe(path.join(dir, "2026", "10", "a".repeat(32) + ".png"));
    for (const bad of ["../.env.local", "2026/10/../../x.png", "2026\\10\\" + "a".repeat(32) + ".png", "/etc/passwd", "2026/10/" + "a".repeat(32) + ".html", ""]) {
      expect(resolveStored(dir, bad)).toBeNull();
    }
  });

  it("cleans display names", () => {
    expect(cleanOriginalName("../../secret/report<1>.png")).toBe("report1.png");
    expect(cleanOriginalName("a\u0000b.png")).toBe("ab.png");
    expect(cleanOriginalName("")).toBe("file");
    expect(cleanOriginalName("x".repeat(300))).toHaveLength(120);
  });

  it("requires UPLOAD_DIR", () => {
    expect(() => uploadDir({})).toThrow(/UPLOAD_DIR is missing/);
    expect(uploadDir({ UPLOAD_DIR: dir })).toBe(path.resolve(dir));
  });
});
