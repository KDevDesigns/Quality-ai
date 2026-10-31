// Notification tones people upload for themselves (CLAUDE.md rule 4): the type comes from the file's first bytes and
// the length from inside the file, never from the browser's MIME type or the file name.

import { UploadError } from "./files";
import { TONE_MAX_BYTES, TONE_MAX_SECONDS } from "./limits";

export { TONE_MAX_BYTES, TONE_MAX_SECONDS };

type AudioType = { mime: "audio/mpeg" | "audio/wav"; ext: "mp3" | "wav" };

const ascii = (b: Uint8Array, from: number, n = 4) => String.fromCharCode(...b.subarray(from, from + n));
const u32le = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;
const u32be = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;

/** Where the audio starts after an ID3v2 tag (sizes are "syncsafe": 7 bits per byte). */
function id3End(b: Uint8Array): number {
  if (ascii(b, 0, 3) !== "ID3" || b.length < 10) return 0;
  const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
  return 10 + size + (b[5] & 0x10 ? 10 : 0);
}

// MPEG audio Layer III (MP3) frame header tables. Version index 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5.
const KBPS_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const KBPS_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

type Mp3Frame = { at: number; version: number; kbps: number; rate: number; mono: boolean };

function mp3Frame(b: Uint8Array, at: number): Mp3Frame | null {
  if (at + 4 > b.length || b[at] !== 0xff || (b[at + 1] & 0xe0) !== 0xe0) return null;
  const version = (b[at + 1] >> 3) & 3;
  const layer = (b[at + 1] >> 1) & 3;
  const kbpsIdx = b[at + 2] >> 4;
  const rateIdx = (b[at + 2] >> 2) & 3;
  if (version === 1 || layer !== 1 || kbpsIdx === 0 || kbpsIdx === 15 || rateIdx === 3) return null;
  return { at, version, kbps: (version === 3 ? KBPS_V1 : KBPS_V2)[kbpsIdx], rate: RATES[version][rateIdx], mono: b[at + 3] >> 6 === 3 };
}

/** The first MP3 frame, looking a little past the ID3 tag (some files pad it). */
function firstMp3Frame(b: Uint8Array): Mp3Frame | null {
  const start = id3End(b);
  for (let i = start; i < Math.min(b.length - 4, start + 4096); i++) {
    const f = mp3Frame(b, i);
    if (f) return f;
  }
  return null;
}

/** MP3 or WAV from the magic bytes, or null. */
export function sniffAudio(b: Uint8Array): AudioType | null {
  if (ascii(b, 0) === "RIFF" && ascii(b, 8) === "WAVE") return { mime: "audio/wav", ext: "wav" };
  return firstMp3Frame(b) ? { mime: "audio/mpeg", ext: "mp3" } : null;
}

function mp3Duration(b: Uint8Array): number | null {
  const f = firstMp3Frame(b);
  if (!f) return null;
  const samplesPerFrame = f.version === 3 ? 1152 : 576;
  // A VBR file says how many frames it has in a "Xing"/"Info" or "VBRI" header inside the first frame.
  const xing = f.at + 4 + (f.version === 3 ? (f.mono ? 17 : 32) : f.mono ? 9 : 17);
  const tag = ascii(b, xing);
  if ((tag === "Xing" || tag === "Info") && b[xing + 7] & 1) return (u32be(b, xing + 8) * samplesPerFrame) / f.rate;
  if (ascii(b, f.at + 36) === "VBRI") return (u32be(b, f.at + 36 + 14) * samplesPerFrame) / f.rate;
  // Otherwise constant bitrate: the audio bytes divided by the bytes per second.
  return ((b.length - f.at) * 8) / (f.kbps * 1000);
}

function wavDuration(b: Uint8Array): number | null {
  let byteRate = 0;
  for (let at = 12; at + 8 <= b.length; ) {
    const id = ascii(b, at);
    const size = u32le(b, at + 4);
    if (id === "fmt " && size >= 16) byteRate = u32le(b, at + 16);
    if (id === "data") return byteRate ? Math.min(size, b.length - at - 8) / byteRate : null;
    at += 8 + size + (size & 1);
  }
  return null;
}

/** Length in seconds, or null when it can't be read. */
export function audioDuration(b: Uint8Array, mime: AudioType["mime"]): number | null {
  return mime === "audio/wav" ? wavDuration(b) : mp3Duration(b);
}

/** Checks an uploaded tone's real type, size and length. Throws UploadError with a message the person can act on. */
export function checkTone(b: Uint8Array): AudioType {
  if (!b.length) throw new UploadError("Choose a sound file.");
  if (b.length > TONE_MAX_BYTES) throw new UploadError(`The sound is too big: at most ${TONE_MAX_BYTES / 1024} KB.`);
  const type = sniffAudio(b);
  if (!type) throw new UploadError("That isn't an MP3 or WAV sound.");
  const seconds = audioDuration(b, type.mime);
  if (seconds === null) throw new UploadError("Couldn't read how long the sound is. Try another MP3 or WAV file.");
  if (seconds > TONE_MAX_SECONDS + 0.05) throw new UploadError(`The sound is ${seconds.toFixed(1)} s long: at most ${TONE_MAX_SECONDS} s.`);
  return type;
}
