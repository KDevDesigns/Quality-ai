import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { audioDuration, checkTone, sniffAudio, TONE_MAX_BYTES, TONE_MAX_SECONDS } from "@/lib/uploads/audio";
import { UploadError } from "@/lib/uploads/files";

/** A minimal PCM WAV: 8 kHz, mono, 8-bit, so one byte per sample. */
function wav(seconds: number): Uint8Array {
  const data = 8000 * seconds;
  const b = Buffer.alloc(44 + data);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + data, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(8000, 24); // sample rate
  b.writeUInt32LE(8000, 28); // byte rate
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(data, 40);
  return b;
}

const tone = (n: number) => readFileSync(path.join(process.cwd(), "public", "sounds", `tone-${n}.mp3`));

describe("sniffAudio", () => {
  it("knows MP3 and WAV by their bytes, not their names", () => {
    expect(sniffAudio(tone(1))).toEqual({ mime: "audio/mpeg", ext: "mp3" });
    expect(sniffAudio(wav(1))).toEqual({ mime: "audio/wav", ext: "wav" });
  });

  it("refuses anything else", () => {
    expect(sniffAudio(Buffer.from("<html>not a sound</html>"))).toBeNull();
    expect(sniffAudio(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull(); // a PNG
    expect(sniffAudio(new Uint8Array(0))).toBeNull();
  });
});

describe("audioDuration", () => {
  it("reads a WAV's length", () => {
    expect(audioDuration(wav(2), "audio/wav")).toBeCloseTo(2, 5);
  });

  it("reads every preset tone, and each one is within the limits for uploads", () => {
    for (let n = 1; n <= 11; n++) {
      const b = tone(n);
      const s = audioDuration(b, "audio/mpeg");
      expect(s, `tone-${n}`).toBeGreaterThan(0.2);
      expect(s, `tone-${n}`).toBeLessThanOrEqual(TONE_MAX_SECONDS);
      expect(b.length).toBeLessThanOrEqual(TONE_MAX_BYTES);
    }
  });
});

describe("checkTone", () => {
  it("accepts a short MP3 or WAV", () => {
    expect(checkTone(tone(1))).toEqual({ mime: "audio/mpeg", ext: "mp3" });
    expect(checkTone(wav(1))).toEqual({ mime: "audio/wav", ext: "wav" });
  });

  it("refuses empty, too long, too big and non-audio files with a clear message", () => {
    expect(() => checkTone(new Uint8Array(0))).toThrow(UploadError);
    expect(() => checkTone(wav(6))).toThrow(/6\.0 s long/);
    expect(() => checkTone(new Uint8Array(TONE_MAX_BYTES + 1))).toThrow(/too big/);
    expect(() => checkTone(Buffer.from("MZ this is a program"))).toThrow(/isn't an MP3 or WAV/);
  });
});
