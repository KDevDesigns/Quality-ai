// How long a stored video is, read from its container headers without decoding anything.
// MP4: moov/mvhd (moov may sit at the end of the file). WebM: Segment/Info/Duration, which browser recordings
// (MediaRecorder) often leave out; then the answer is null and only the size cap applies.

import { open, type FileHandle } from "node:fs/promises";

/** moov holds the sample tables; for a few minutes of video it is well under this. */
const MOOV_MAX = 32 * 1024 * 1024;
/** WebM keeps Info near the start; this much is plenty. */
const WEBM_HEAD = 1024 * 1024;

/** Whole seconds, or null when the file doesn't say. */
export async function videoDuration(file: string, mime: string): Promise<number | null> {
  const fh = await open(file, "r");
  try {
    const seconds = mime === "video/mp4" ? await mp4Duration(fh) : mime === "video/webm" ? await webmDuration(fh) : null;
    return seconds === null || !Number.isFinite(seconds) || seconds < 0 ? null : Math.round(seconds);
  } finally {
    await fh.close();
  }
}

async function readAt(fh: FileHandle, pos: number, length: number): Promise<Buffer> {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await fh.read(buf, 0, length, pos);
  return buf.subarray(0, bytesRead);
}

// ── MP4 ──────────────────────────────────────────────────────────────────────

async function mp4Duration(fh: FileHandle): Promise<number | null> {
  const { size } = await fh.stat();
  let pos = 0;
  while (pos + 8 <= size) {
    const head = await readAt(fh, pos, 16);
    if (head.length < 8) return null;
    let boxSize = head.readUInt32BE(0);
    const type = head.toString("latin1", 4, 8);
    let headerLen = 8;
    if (boxSize === 1) {
      if (head.length < 16) return null;
      boxSize = Number(head.readBigUInt64BE(8));
      headerLen = 16;
    } else if (boxSize === 0) {
      boxSize = size - pos;
    }
    if (boxSize < headerLen) return null;
    if (type === "moov") {
      const len = boxSize - headerLen;
      if (len > MOOV_MAX) return null;
      return mvhdDuration(await readAt(fh, pos + headerLen, len));
    }
    pos += boxSize;
  }
  return null;
}

/** Finds mvhd among moov's children and returns duration / timescale. */
export function mvhdDuration(moov: Buffer): number | null {
  let pos = 0;
  while (pos + 8 <= moov.length) {
    const boxSize = moov.readUInt32BE(pos);
    const type = moov.toString("latin1", pos + 4, pos + 8);
    if (type === "mvhd") {
      const body = pos + 8;
      if (body + 1 > moov.length) return null;
      const version = moov[body];
      // version+flags (4), then creation and modification times (4 or 8 each), timescale (4), duration (4 or 8)
      const ts = version === 1 ? body + 4 + 16 : body + 4 + 8;
      const durLen = version === 1 ? 8 : 4;
      if (ts + 4 + durLen > moov.length) return null;
      const timescale = moov.readUInt32BE(ts);
      // All ones means "unknown".
      const unknown = version === 1 ? moov.readUInt32BE(ts + 4) === 0xffffffff && moov.readUInt32BE(ts + 8) === 0xffffffff : moov.readUInt32BE(ts + 4) === 0xffffffff;
      if (!timescale || unknown) return null;
      const duration = version === 1 ? Number(moov.readBigUInt64BE(ts + 4)) : moov.readUInt32BE(ts + 4);
      return duration / timescale;
    }
    if (boxSize < 8) return null;
    pos += boxSize;
  }
  return null;
}

// ── WebM (EBML) ──────────────────────────────────────────────────────────────

const SEGMENT = 0x18538067;
const INFO = 0x1549a966;
const TIMECODE_SCALE = 0x2ad7b1;
const DURATION = 0x4489;
const EBML = 0x1a45dfa3;

/** A variable-length integer at `pos`: its value (marker bit kept for ids, dropped for sizes) and length. */
function vint(b: Buffer, pos: number, keepMarker: boolean): { value: number; len: number; unknown: boolean } | null {
  if (pos >= b.length) return null;
  const first = b[pos];
  let len = 1;
  while (len <= 8 && !(first & (0x80 >> (len - 1)))) len++;
  if (len > 8 || pos + len > b.length) return null;
  let value = keepMarker ? first : first & (0xff >> len);
  let allOnes = value === (0xff >> len);
  for (let i = 1; i < len; i++) {
    value = value * 256 + b[pos + i];
    if (b[pos + i] !== 0xff) allOnes = false;
  }
  return { value, len, unknown: !keepMarker && allOnes };
}

/** Walks the elements in b[start, end) and calls `visit` for each; return true from visit to stop. */
function walk(b: Buffer, start: number, end: number, visit: (id: number, dataStart: number, dataEnd: number, unknownSize: boolean) => boolean | void) {
  let pos = start;
  while (pos < end) {
    const id = vint(b, pos, true);
    if (!id) return;
    const size = vint(b, pos + id.len, false);
    if (!size) return;
    const dataStart = pos + id.len + size.len;
    const dataEnd = size.unknown ? end : Math.min(end, dataStart + size.value);
    if (visit(id.value, dataStart, dataEnd, size.unknown)) return;
    if (size.unknown) return;
    pos = dataStart + size.value;
  }
}

export function webmDurationFrom(b: Buffer): number | null {
  let result: number | null = null;
  walk(b, 0, b.length, (id, s, e) => {
    if (id === EBML) return;
    if (id !== SEGMENT) return true;
    walk(b, s, e, (cid, cs, ce) => {
      if (cid !== INFO) return;
      let scale = 1_000_000;
      let duration: number | null = null;
      walk(b, cs, ce, (iid, is, ie) => {
        if (iid === TIMECODE_SCALE) {
          let v = 0;
          for (let i = is; i < ie; i++) v = v * 256 + b[i];
          if (v) scale = v;
        } else if (iid === DURATION) {
          if (ie - is === 8) duration = b.readDoubleBE(is);
          else if (ie - is === 4) duration = b.readFloatBE(is);
        }
      });
      if (duration !== null) result = (duration * scale) / 1e9;
      return true;
    });
    return true;
  });
  return result;
}

async function webmDuration(fh: FileHandle): Promise<number | null> {
  return webmDurationFrom(await readAt(fh, 0, WEBM_HEAD));
}
