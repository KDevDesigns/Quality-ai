// Files shared to the installed app from a phone's gallery (Share → QA Hub). public/sw.js holds them in the browser's Cache
// Storage until New ticket collects them, so they survive a sign-in on the way there. This is the only ticket material the app
// keeps on a phone, so it goes as soon as it's collected, after a day, or on sign-out. From here on they're ordinary picked
// files, with the normal upload and checks.

/** Keep in sync with public/sw.js, which can't import this file. */
export const SHARED_CACHE = "qa-hub-shared";
export const SHARED_NAME_HEADER = "x-shared-name";
export const SHARED_AT_HEADER = "x-shared-at";
export const SHARED_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Store = Pick<CacheStorage, "open" | "delete">;

/** The waiting files, leaving out any older than a day, removed from the store so they can only be collected once. */
export async function takeSharedFiles(store: Store = caches, now = Date.now()): Promise<File[]> {
  const cache = await store.open(SHARED_CACHE);
  const files: File[] = [];
  for (const key of await cache.keys()) {
    const res = await cache.match(key);
    if (!res || now - Number(res.headers.get(SHARED_AT_HEADER)) > SHARED_MAX_AGE_MS) continue;
    const blob = await res.blob();
    files.push(new File([blob], decodeURIComponent(res.headers.get(SHARED_NAME_HEADER) ?? "shared"), { type: blob.type }));
  }
  await store.delete(SHARED_CACHE);
  return files;
}

/** Deletes shares nobody collected within the day. Never throws: it's only tidying up. */
export async function dropOldSharedFiles(store: Store = caches, now = Date.now()): Promise<void> {
  try {
    const cache = await store.open(SHARED_CACHE);
    for (const key of await cache.keys()) {
      const res = await cache.match(key);
      if (!res || now - Number(res.headers.get(SHARED_AT_HEADER)) > SHARED_MAX_AGE_MS) await cache.delete(key);
    }
  } catch {
    // Browser storage can be unavailable.
  }
}

/** Deletes everything waiting, on sign-out: the phone may be shared. Never throws. */
export async function dropAllSharedFiles(store: Store = caches): Promise<void> {
  await store.delete(SHARED_CACHE).catch(() => {});
}
