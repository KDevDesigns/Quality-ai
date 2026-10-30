// Ticket attachments (CLAUDE.md rule 13): stored in the private Storage bucket under generated names only.
// The browser uploads straight to Storage; checkUploaded then decides the type from the file's first bytes, never from
// the browser's MIME type or the file name, and deletes anything that isn't what it claimed to be.

import { randomBytes } from "node:crypto";
import { formatDuration } from "@/lib/format";
import { acceptedTypes, maxBytes, VIDEO_MAX_SECONDS, type UploadKind } from "./limits";
import { videoDuration, type ReadAt } from "./video-meta";

export class UploadError extends Error {}

type FileType = { mime: string; ext: string };

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);

/** PNG, JPEG, WebP or GIF from the magic bytes, or null. */
export function sniffImage(b: Uint8Array): FileType | null {
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(b, [0x47, 0x49, 0x46, 0x38]) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return { mime: "image/gif", ext: "gif" };
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

/** MP4 brands browsers play. QuickTime (.mov, brand "qt  ") and image containers (HEIC, AVIF) are refused. */
const MP4_BRAND = /^(isom|iso[2-9]|mp41|mp42|avc1|M4V |M4VP|dash|MSNV|3gp[4-6])$/;

/** MP4 or WebM from the magic bytes, or null. Needs the first 64 bytes or so. */
export function sniffVideo(b: Uint8Array): FileType | null {
  if (startsWith(b, [0x66, 0x74, 0x79, 0x70], 4)) {
    const ascii = (from: number) => String.fromCharCode(...b.subarray(from, from + 4));
    const boxSize = Math.min(b.length, ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0);
    const major = ascii(8);
    if (major === "qt  ") return null;
    // The major brand, then (after a 4-byte minor version) the compatible brands.
    const brands = [major];
    for (let i = 16; i + 4 <= boxSize; i += 4) brands.push(ascii(i));
    return brands.some((x) => MP4_BRAND.test(x)) ? { mime: "video/mp4", ext: "mp4" } : null;
  }
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) {
    // The EBML header's DocType says "webm" (Matroska .mkv says "matroska" and isn't played by browsers).
    const head = String.fromCharCode(...b.subarray(0, 64));
    return head.includes("webm") ? { mime: "video/webm", ext: "webm" } : null;
  }
  return null;
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm" };

/** The name shown to people: no folders, no control characters, at most 120 characters. */
export function cleanOriginalName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim();
  return (clean || "file").slice(0, 120);
}

const STORED = /^\d{4}\/\d{2}\/[a-f0-9]{32}\.(png|jpg|gif|webp|mp4|webm)$/;

/** True for an object key this module generated; anything else is never passed to Storage. */
export const isStoredName = (name: string) => STORED.test(name);

/** `YYYY/MM/<random>.<ext>`: the object key. Never derived from the uploader's file name. */
export function newStoredName(now: Date, ext: string): string {
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${ext}`;
}

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;
const what = (kind: UploadKind) => (kind === "IMAGE" ? "a PNG, JPEG, WebP or GIF image" : "an MP4 or WebM video");

/**
 * Checks what the browser says it is about to upload, before it gets a signed URL. Returns the object key to use.
 * The real bytes are checked again by checkUploaded once the file has arrived.
 */
export function planUpload(input: { kind: UploadKind; name: string; type: string; size: number }, now = new Date()): { storedName: string; originalName: string; mime: string } {
  const originalName = cleanOriginalName(input.name);
  if (!acceptedTypes(input.kind).includes(input.type)) throw new UploadError(`${originalName} isn't ${what(input.kind)}.`);
  if (!Number.isSafeInteger(input.size) || input.size <= 0) throw new UploadError(`${originalName} is empty.`);
  const limit = maxBytes(input.kind);
  if (input.size > limit) throw new UploadError(`${originalName} is larger than ${mb(limit)}.`);
  return { storedName: newStoredName(now, EXT[input.type]), originalName, mime: input.type };
}

export type UploadedObject = {
  kind: UploadKind;
  storedName: string;
  originalName: string;
  /** From Storage's metadata, not from the browser. */
  size: number;
  /** The Content-Type Storage will serve the object with. */
  contentType: string | null;
  read: ReadAt;
};

/**
 * Checks a file that has arrived in Storage: its real size, its type from the first bytes (which must match its
 * stored name and the Content-Type Storage serves it with) and, for videos, its length. Throws UploadError when it
 * should be deleted.
 */
export async function checkUploaded(o: UploadedObject): Promise<{ mime: string; size: number; durationSec: number | null }> {
  const name = o.originalName;
  if (o.size <= 0) throw new UploadError(`${name} is empty.`);
  const limit = maxBytes(o.kind);
  if (o.size > limit) throw new UploadError(`${name} is larger than ${mb(limit)}.`);

  const head = await o.read(0, 64);
  const type = o.kind === "IMAGE" ? sniffImage(head) : sniffVideo(head);
  if (!type) throw new UploadError(`${name} isn't ${what(o.kind)}.`);
  // A PNG header followed by HTML, uploaded as text/html, must not be served as a page.
  if (!o.storedName.endsWith(`.${type.ext}`) || (o.contentType !== null && o.contentType !== type.mime)) {
    throw new UploadError(`${name} isn't ${what(o.kind)}.`);
  }
  if (o.kind === "IMAGE") return { mime: type.mime, size: o.size, durationSec: null };

  const durationSec = await videoDuration(o.read, o.size, type.mime).catch(() => null);
  if (durationSec !== null && durationSec > VIDEO_MAX_SECONDS) {
    throw new UploadError(`${name} is ${formatDuration(durationSec)} long. Videos can be at most ${formatDuration(VIDEO_MAX_SECONDS)}; trim it or split it.`);
  }
  return { mime: type.mime, size: o.size, durationSec };
}
