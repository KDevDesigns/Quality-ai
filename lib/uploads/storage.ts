import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isStoredName, UploadError } from "./files";
import type { ReadAt } from "./video-meta";

// The private Supabase Storage bucket that holds ticket attachments (CLAUDE.md rule 4). Only the server talks to it,
// with the service-role key; browsers get one signed URL at a time, after the session and ticket checks.

export const BUCKET = process.env.SUPABASE_BUCKET || "attachments";

/** Signed read URLs last this long. A video player keeps using its URL for Range requests while someone watches. */
export const READ_URL_TTL_S = 60 * 60;

let client: SupabaseClient | null = null;

function bucket() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new UploadError("Uploads aren't set up yet: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Ask the admin who runs QA Hub.");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client.storage.from(BUCKET);
}

function key(storedName: string): string {
  if (!isStoredName(storedName)) throw new Error(`Not a stored object name: ${storedName}`);
  return storedName;
}

/** A URL the browser PUTs the file to (valid for 2 hours), and the headers it must send. */
export async function signUpload(storedName: string, mime: string): Promise<{ url: string; headers: Record<string, string> }> {
  const { data, error } = await bucket().createSignedUploadUrl(key(storedName));
  if (error) throw new Error(`Storage couldn't sign the upload: ${error.message}`);
  return { url: data.signedUrl, headers: { "content-type": mime, "x-upsert": "false" } };
}

/**
 * Stores a small file the server already holds and has checked (a notification tone, at most a few hundred KB).
 * Ticket attachments never come this way: browsers upload those straight to Storage with signUpload.
 */
export async function putObject(storedName: string, bytes: Uint8Array, mime: string): Promise<void> {
  const { error } = await bucket().upload(key(storedName), bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(`Storage couldn't save the file: ${error.message}`);
}

/** The object's size and Content-Type, or null when nothing was uploaded under that name. */
export async function objectInfo(storedName: string): Promise<{ size: number; contentType: string | null } | null> {
  const { data, error } = await bucket().info(key(storedName));
  if (error || !data) return null;
  const size = Number(data.size ?? (data.metadata as { size?: number } | undefined)?.size);
  const contentType = (data.contentType ?? (data.metadata as { mimetype?: string } | undefined)?.mimetype ?? null) as string | null;
  return Number.isFinite(size) ? { size, contentType } : null;
}

/** A short-lived signed GET URL. `download` makes the browser save it under that name instead of showing it. */
export async function signedReadUrl(storedName: string, { expiresIn = READ_URL_TTL_S, download }: { expiresIn?: number; download?: string } = {}): Promise<string> {
  const { data, error } = await bucket().createSignedUrl(key(storedName), expiresIn, download ? { download } : undefined);
  if (error) throw new Error(`Storage couldn't sign the file: ${error.message}`);
  return data.signedUrl;
}

/** Random access to an object through Range requests on one signed URL, for checking what was uploaded. */
export async function objectReader(storedName: string): Promise<ReadAt> {
  const url = await signedReadUrl(storedName, { expiresIn: 120 });
  return async (pos, length) => {
    if (length <= 0) return Buffer.alloc(0);
    const res = await fetch(url, { headers: { Range: `bytes=${pos}-${pos + length - 1}` }, cache: "no-store" });
    if (res.status === 416) return Buffer.alloc(0);
    if (!res.ok) throw new Error(`Storage read failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    // A server that ignores Range sends the whole file with 200.
    return res.status === 206 ? buf.subarray(0, length) : buf.subarray(pos, pos + length);
  };
}

/** Deletes objects. Missing ones are ignored. */
export async function removeObjects(storedNames: string[]): Promise<void> {
  const names = storedNames.filter(isStoredName);
  if (!names.length) return;
  const { error } = await bucket().remove(names);
  if (error) throw new Error(`Storage couldn't delete files: ${error.message}`);
}
