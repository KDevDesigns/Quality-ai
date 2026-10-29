// Ticket attachments on disk (CLAUDE.md rule 13): outside the repo in UPLOAD_DIR, under generated names only.
// The type is decided from the file's first bytes, never from the browser's MIME type or the file name.

import { randomBytes } from "node:crypto";
import { mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatDuration } from "@/lib/format";
import { videoDuration } from "./video-meta";

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_POST = 6;
export const VIDEO_MAX_BYTES = 150 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 3 * 60;
export const MAX_VIDEOS_PER_POST = 1;

export class UploadError extends Error {}

export type SavedFile = { kind: "IMAGE" | "VIDEO"; storedName: string; originalName: string; mime: string; size: number; durationSec?: number | null };

type ImageType = { mime: string; ext: string };

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);

/** PNG, JPEG, WebP or GIF from the magic bytes, or null. */
export function sniffImage(b: Uint8Array): ImageType | null {
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(b, [0x47, 0x49, 0x46, 0x38]) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return { mime: "image/gif", ext: "gif" };
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

/** MP4 brands browsers play. QuickTime (.mov, brand "qt  ") and image containers (HEIC, AVIF) are refused. */
const MP4_BRAND = /^(isom|iso[2-9]|mp41|mp42|avc1|M4V |M4VP|dash|MSNV|3gp[4-6])$/;

/** MP4 or WebM from the magic bytes, or null. Needs the first 64 bytes or so. */
export function sniffVideo(b: Uint8Array): ImageType | null {
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

/** UPLOAD_DIR as an absolute path. It must be set; uploads never fall back to a folder inside the repo. */
export function uploadDir(env: Record<string, string | undefined> = process.env): string {
  const dir = env.UPLOAD_DIR?.trim();
  if (!dir) throw new UploadError("Uploads aren't set up yet: UPLOAD_DIR is missing from .env.local. Ask the admin who runs QA Hub.");
  return path.resolve(dir);
}

/** The name shown to people: no folders, no control characters, at most 120 characters. */
export function cleanOriginalName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim();
  return (clean || "file").slice(0, 120);
}

const STORED = /^\d{4}\/\d{2}\/[a-f0-9]{32}\.(png|jpg|gif|webp|mp4|webm)$/;

/** The absolute path of a stored file, or null if the name isn't one this module generated. */
export function resolveStored(dir: string, storedName: string): string | null {
  if (!STORED.test(storedName)) return null;
  return path.join(dir, ...storedName.split("/"));
}

/** Checks an image and writes it to `dir/YYYY/MM/<random>.<ext>`. */
export async function saveImage(dir: string, bytes: Uint8Array, originalName: string, now = new Date()): Promise<SavedFile> {
  const name = cleanOriginalName(originalName);
  if (bytes.length === 0) throw new UploadError(`${name} is empty.`);
  if (bytes.length > IMAGE_MAX_BYTES) throw new UploadError(`${name} is larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
  const type = sniffImage(bytes);
  if (!type) throw new UploadError(`${name} isn't a PNG, JPEG, WebP or GIF image.`);

  const storedName = newStoredName(now, type.ext);
  const file = resolveStored(dir, storedName)!;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes, { flag: "wx" });
  return { kind: "IMAGE", storedName, originalName: name, mime: type.mime, size: bytes.length };
}

const newStoredName = (now: Date, ext: string) =>
  `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${ext}`;

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

/**
 * Streams a video to `dir/YYYY/MM/<random>.part` without holding it in memory, checks its type from the first bytes,
 * its size as it arrives and its length once written, then renames it to `<random>.mp4|webm`.
 * On any problem (including the browser cancelling) the partial file is removed.
 */
export async function saveVideoStream(
  dir: string,
  body: ReadableStream<Uint8Array>,
  originalName: string,
  { now = new Date(), maxBytes = VIDEO_MAX_BYTES }: { now?: Date; maxBytes?: number } = {},
): Promise<SavedFile> {
  const name = cleanOriginalName(originalName);
  const base = newStoredName(now, "part");
  const part = path.join(dir, ...base.split("/"));
  await mkdir(path.dirname(part), { recursive: true });
  const fh = await open(part, "wx");
  let closed = false;
  try {
    let size = 0;
    let type: ImageType | null = null;
    let head: Uint8Array = new Uint8Array(0);
    const reader = body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new UploadError(`${name} is larger than ${mb(maxBytes)}.`);
      }
      if (!type) {
        head = concat(head, value);
        if (head.length < 64) continue;
        type = sniffVideo(head);
        if (!type) {
          await reader.cancel().catch(() => {});
          throw new UploadError(`${name} isn't an MP4 or WebM video.`);
        }
        await fh.write(head);
        continue;
      }
      await fh.write(value);
    }
    if (size === 0) throw new UploadError(`${name} is empty.`);
    if (!type) {
      type = sniffVideo(head);
      if (!type) throw new UploadError(`${name} isn't an MP4 or WebM video.`);
      await fh.write(head);
    }
    await fh.close();
    closed = true;

    const durationSec = await videoDuration(part, type.mime).catch(() => null);
    if (durationSec !== null && durationSec > VIDEO_MAX_SECONDS) {
      throw new UploadError(`${name} is ${formatDuration(durationSec)} long. Videos can be at most ${formatDuration(VIDEO_MAX_SECONDS)}; trim it or split it.`);
    }
    const storedName = base.replace(/\.part$/, `.${type.ext}`);
    await rename(part, resolveStored(dir, storedName)!);
    return { kind: "VIDEO", storedName, originalName: name, mime: type.mime, size, durationSec };
  } catch (e) {
    if (!closed) await fh.close().catch(() => {});
    await rm(part, { force: true });
    throw e;
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

/** Best-effort cleanup when the database write that should have referenced these files fails. */
export async function removeStored(dir: string, files: { storedName: string }[]): Promise<void> {
  await Promise.all(
    files.map((f) => {
      const p = resolveStored(dir, f.storedName);
      return p ? rm(p, { force: true }) : undefined;
    }),
  );
}
