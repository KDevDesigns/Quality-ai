import { describe, expect, it } from "vitest";
import { checkUploaded, sniffVideo, UploadError, type UploadedObject } from "@/lib/uploads/files";
import { VIDEO_MAX_SECONDS } from "@/lib/uploads/limits";
import { bufferReader, mvhdDuration, videoDuration, webmDurationFrom } from "@/lib/uploads/video-meta";

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

/** Counts reads, to show a duration check fetches only the boxes it needs, not the whole file. */
function countingReader(buf: Buffer) {
  const r = { calls: 0, bytes: 0, read: bufferReader(buf) };
  const read: typeof r.read = async (pos, len) => {
    r.calls++;
    const out = await bufferReader(buf)(pos, len);
    r.bytes += out.length;
    return out;
  };
  return Object.assign(r, { read });
}

const arrived = (buf: Buffer, ext: "mp4" | "webm", patch: Partial<UploadedObject> = {}): UploadedObject => ({
  kind: "VIDEO",
  storedName: `2026/10/${"b".repeat(32)}.${ext}`,
  originalName: `Bill bug.${ext}`,
  size: buf.length,
  contentType: `video/${ext}`,
  read: bufferReader(buf),
  ...patch,
});

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
    const dur = (b: Buffer) => videoDuration(bufferReader(b), b.length, "video/mp4");
    expect(await dur(mp4(42.5))).toBe(43);
    expect(await dur(mp4(61, { moovLast: true }))).toBe(61);
    expect(await dur(mp4(150, { version: 1 }))).toBe(150);
    expect(await dur(Buffer.concat([ftyp(), box("mdat", Buffer.alloc(10))]))).toBeNull();
  });

  it("skips over mdat instead of reading it", async () => {
    const file = mp4(30, { moovLast: true });
    const r = countingReader(file);
    expect(await videoDuration(r.read, file.length, "video/mp4")).toBe(30);
    expect(r.bytes).toBeLessThan(file.length);
  });

  it("reads WebM Duration, and returns null when a recording leaves it out", () => {
    expect(webmDurationFrom(webm(42))).toBe(42);
    expect(webmDurationFrom(webm(null))).toBeNull();
    expect(webmDurationFrom(Buffer.from("garbage"))).toBeNull();
  });
});

describe("checkUploaded (videos)", () => {
  it("accepts MP4 and WebM and reports the length", async () => {
    const file = mp4(30, { moovLast: true });
    expect(await checkUploaded(arrived(file, "mp4"))).toEqual({ mime: "video/mp4", size: file.length, durationSec: 30 });
    expect(await checkUploaded(arrived(webm(null), "webm"))).toMatchObject({ mime: "video/webm", durationSec: null });
  });

  it("refuses non-videos, mismatched names and overlong recordings", async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
    await expect(checkUploaded(arrived(png, "mp4"))).rejects.toThrow(/isn't an MP4 or WebM/);
    await expect(checkUploaded(arrived(webm(5), "mp4"))).rejects.toBeInstanceOf(UploadError);
    await expect(checkUploaded(arrived(mp4(5), "mp4", { contentType: "text/html" }))).rejects.toBeInstanceOf(UploadError);
    await expect(checkUploaded(arrived(mp4(VIDEO_MAX_SECONDS + 1), "mp4"))).rejects.toThrow(/3:01 long/);
  });
});
