import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { resolveStored, saveVideoStream, sniffVideo, UploadError, VIDEO_MAX_SECONDS } from "@/lib/uploads/files";
import { mvhdDuration, videoDuration, webmDurationFrom } from "@/lib/uploads/video-meta";

const dir = mkdtempSync(path.join(tmpdir(), "qa-videos-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

// ── Tiny hand-built containers: just enough structure for the sniffers and duration readers ──

const box = (type: string, body: Buffer) => {
  const h = Buffer.alloc(8);
  h.writeUInt32BE(8 + body.length, 0);
  h.write(type, 4, "latin1");
  return Buffer.concat([h, body]);
};
const ftyp = (major = "isom", compat = ["isom", "mp41"]) =>
  box("ftyp", Buffer.concat([Buffer.from(major, "latin1"), Buffer.from([0, 0, 2, 0]), Buffer.from(compat.join(""), "latin1")]));
function mvhd(seconds: number, version: 0 | 1 = 0) {
  const timescale = 1000;
  const body = Buffer.alloc(version === 1 ? 112 : 100);
  body[0] = version;
  const ts = version === 1 ? 4 + 16 : 4 + 8;
  body.writeUInt32BE(timescale, ts);
  if (version === 1) body.writeBigUInt64BE(BigInt(Math.round(seconds * timescale)), ts + 4);
  else body.writeUInt32BE(Math.round(seconds * timescale), ts + 4);
  return box("mvhd", body);
}
const mp4 = (seconds: number, { moovLast = false, version = 0 as 0 | 1 } = {}) => {
  const moov = box("moov", mvhd(seconds, version));
  const mdat = box("mdat", Buffer.alloc(200, 7));
  return moovLast ? Buffer.concat([ftyp(), mdat, moov]) : Buffer.concat([ftyp(), moov, mdat]);
};

/** EBML element: id bytes, a 1-byte size (data under 127 bytes) or the "unknown" size, then the data. */
const el = (id: number[], data: Buffer, unknownSize = false) =>
  Buffer.concat([Buffer.from(id), unknownSize ? Buffer.from([0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]) : Buffer.from([0x80 | data.length]), data]);
function webm(seconds: number | null) {
  const header = el([0x1a, 0x45, 0xdf, 0xa3], el([0x42, 0x82], Buffer.from("webm")));
  const dur = Buffer.alloc(8);
  if (seconds !== null) dur.writeDoubleBE(seconds * 1000); // timecode units of 1 ms
  const info = el(
    [0x15, 0x49, 0xa9, 0x66],
    Buffer.concat([el([0x2a, 0xd7, 0xb1], Buffer.from([0x0f, 0x42, 0x40])), ...(seconds !== null ? [el([0x44, 0x89], dur)] : [])]),
  );
  const cluster = el([0x1f, 0x43, 0xb6, 0x75], Buffer.alloc(100, 1));
  // A MediaRecorder-style Segment of unknown size.
  return Buffer.concat([header, el([0x18, 0x53, 0x80, 0x67], Buffer.concat([info, cluster]), true)]);
}

const streamOf = (buf: Buffer, chunk = 37) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < buf.length; i += chunk) c.enqueue(new Uint8Array(buf.subarray(i, i + chunk)));
      c.close();
    },
  });
const leftovers = () =>
  readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".part"));

describe("sniffVideo", () => {
  it("knows MP4 and WebM from their first bytes", () => {
    expect(sniffVideo(mp4(5))?.mime).toBe("video/mp4");
    expect(sniffVideo(ftyp("mp42", ["mp42"]))?.ext).toBe("mp4");
    expect(sniffVideo(ftyp("XXXX", ["XXXX", "isom"]))?.mime).toBe("video/mp4");
    expect(sniffVideo(webm(5))?.mime).toBe("video/webm");
  });

  it("refuses QuickTime, HEIC, Matroska, images and text", () => {
    expect(sniffVideo(ftyp("qt  ", ["qt  "]))).toBeNull();
    expect(sniffVideo(ftyp("heic", ["mif1", "heic"]))).toBeNull();
    expect(sniffVideo(el([0x1a, 0x45, 0xdf, 0xa3], el([0x42, 0x82], Buffer.from("matroska"))))).toBeNull();
    expect(sniffVideo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
    expect(sniffVideo(new TextEncoder().encode("<html>not a video</html>"))).toBeNull();
  });
});

describe("video duration", () => {
  it("reads mvhd, version 0 and 1", () => {
    expect(mvhdDuration(mvhd(42.5))).toBe(42.5);
    expect(mvhdDuration(mvhd(90, 1))).toBe(90);
    expect(mvhdDuration(Buffer.alloc(4))).toBeNull();
  });

  it("finds moov at the start or the end of an MP4 file", async () => {
    const a = path.join(dir, "probe.mp4");
    writeFileSync(a, mp4(42.5));
    expect(await videoDuration(a, "video/mp4")).toBe(43);
    writeFileSync(a, mp4(61, { moovLast: true }));
    expect(await videoDuration(a, "video/mp4")).toBe(61);
    writeFileSync(a, mp4(150, { version: 1 }));
    expect(await videoDuration(a, "video/mp4")).toBe(150);
    writeFileSync(a, Buffer.concat([ftyp(), box("mdat", Buffer.alloc(10))]));
    expect(await videoDuration(a, "video/mp4")).toBeNull();
    rmSync(a);
  });

  it("reads WebM Duration, and returns null when a recording leaves it out", () => {
    expect(webmDurationFrom(webm(42))).toBe(42);
    expect(webmDurationFrom(webm(null))).toBeNull();
    expect(webmDurationFrom(Buffer.from("garbage"))).toBeNull();
  });
});

describe("saveVideoStream", () => {
  it("streams to a generated name and reports the length", async () => {
    const file = mp4(30, { moovLast: true });
    const saved = await saveVideoStream(dir, streamOf(file), "C:\\Users\\ana\\Videos\\Bill bug.mp4", { now: new Date(2026, 9, 29) });
    expect(saved).toMatchObject({ kind: "VIDEO", mime: "video/mp4", size: file.length, originalName: "Bill bug.mp4", durationSec: 30 });
    expect(saved.storedName).toMatch(/^2026\/10\/[a-f0-9]{32}\.mp4$/);
    expect(readFileSync(resolveStored(dir, saved.storedName)!).equals(file)).toBe(true);

    const w = await saveVideoStream(dir, streamOf(webm(null), 5), "rec.webm");
    expect(w).toMatchObject({ mime: "video/webm", durationSec: null });
    expect(w.storedName).toMatch(/\.webm$/);
    expect(leftovers()).toEqual([]);
  });

  it("refuses non-videos, empty, oversize and overlong files and leaves nothing behind", async () => {
    const before = readdirSync(dir, { recursive: true }).length;
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
    await expect(saveVideoStream(dir, streamOf(png), "fake.mp4")).rejects.toThrow(/isn't an MP4 or WebM/);
    await expect(saveVideoStream(dir, streamOf(Buffer.alloc(0)), "empty.mp4")).rejects.toThrow(/empty/);
    await expect(saveVideoStream(dir, streamOf(mp4(5)), "big.mp4", { maxBytes: 100 })).rejects.toThrow(/larger than/);
    await expect(saveVideoStream(dir, streamOf(mp4(VIDEO_MAX_SECONDS + 1)), "long.mp4")).rejects.toThrow(/3:01 long/);
    await expect(saveVideoStream(dir, streamOf(png), "x.mp4")).rejects.toBeInstanceOf(UploadError);
    expect(leftovers()).toEqual([]);
    expect(readdirSync(dir, { recursive: true }).length).toBe(before);
  });

  it("removes the partial file when the browser cancels", async () => {
    const broken = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(mp4(5)));
        c.error(new Error("aborted"));
      },
    });
    await expect(saveVideoStream(dir, broken, "cut.mp4")).rejects.toThrow("aborted");
    expect(leftovers()).toEqual([]);
  });
});
