// Upload limits, shared by the pickers (browser) and the upload routes (server) so both refuse the same files.

export type UploadKind = "IMAGE" | "VIDEO";

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_POST = 6;
export const MAX_VIDEOS_PER_POST = 1;
export const VIDEO_MAX_SECONDS = 3 * 60;

/**
 * Videos are capped by the Storage plan: 50 MB per file on Supabase Free. Raise NEXT_PUBLIC_VIDEO_MAX_MB (and the
 * bucket's file size limit) after upgrading. NEXT_PUBLIC_ so the browser checks the same number before uploading.
 */
export const VIDEO_MAX_MB = readMb(process.env.NEXT_PUBLIC_VIDEO_MAX_MB, 50);
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;

/** Uploads one person may have waiting (picked but not yet sent with a ticket or reply). */
export const MAX_PENDING_PER_USER = 20;

/** A notification tone people upload for themselves (lib/uploads/audio.ts). */
export const TONE_MAX_BYTES = 500 * 1024;
export const TONE_MAX_SECONDS = 5;

export const maxBytes = (kind: UploadKind) => (kind === "IMAGE" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES);
export const acceptedTypes = (kind: UploadKind) => (kind === "IMAGE" ? IMAGE_TYPES : VIDEO_TYPES);

function readMb(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 5000 ? n : fallback;
}
