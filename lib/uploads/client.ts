// The browser side of an upload (see app/(main)/uploads): ask for a signed URL, PUT the file straight to Storage with
// progress, then ask the server to check what arrived. Only the returned id goes with the ticket or reply form.

import type { UploadKind } from "./limits";

export type Uploaded = { id: string; name: string; size: number; durationSec: number | null };

export type UploadHandle = { done: Promise<Uploaded>; cancel: () => void };

export class UploadCancelled extends Error {}

/** A phone with no signal: the browser's own "Failed to fetch" means nothing to anyone. */
const reach = (url: string, init: RequestInit) =>
  fetch(url, init).catch(() => {
    throw new Error("The upload was interrupted. Check the connection and try again.");
  });

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !body) throw new Error(body?.error ?? `The upload failed (${res.status}). Try again.`);
  return body;
}

export function uploadFile(file: File, kind: UploadKind, onProgress: (loaded: number) => void): UploadHandle {
  let xhr: XMLHttpRequest | null = null;
  let cancelled = false;
  let id: string | null = null;

  const done = (async () => {
    const signed = await json<{ id: string; url: string; headers: Record<string, string> }>(
      await reach("/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, name: file.name, type: file.type, size: file.size }),
      }),
    );
    id = signed.id;
    if (cancelled) throw new UploadCancelled();

    await new Promise<void>((resolve, reject) => {
      const req = new XMLHttpRequest();
      xhr = req;
      req.open("PUT", signed.url);
      for (const [k, v] of Object.entries(signed.headers)) req.setRequestHeader(k, v);
      req.upload.onprogress = (e) => onProgress(e.loaded);
      req.onload = () => (req.status >= 200 && req.status < 300 ? resolve() : reject(new Error(`The upload failed (${req.status}). Try again.`)));
      req.onerror = () => reject(new Error("The upload was interrupted. Check the connection and try again."));
      req.onabort = () => reject(new UploadCancelled());
      req.send(file);
    });

    return json<Uploaded>(await reach(`/uploads/${encodeURIComponent(signed.id)}`, { method: "POST" }));
  })();

  // Whatever went wrong, don't leave a half-done upload waiting on the server.
  done.catch(() => {
    if (id) void discardUpload(id);
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      xhr?.abort();
    },
  };
}

/** Drops an upload that won't be sent; the server deletes the file. */
export function discardUpload(id: string): Promise<void> {
  return fetch(`/uploads/${encodeURIComponent(id)}`, { method: "DELETE" }).then(
    () => undefined,
    () => undefined,
  );
}
