import { describe, expect, it } from "vitest";
import { dropAllSharedFiles, dropOldSharedFiles, SHARED_AT_HEADER, SHARED_CACHE, SHARED_MAX_AGE_MS, SHARED_NAME_HEADER, takeSharedFiles } from "@/lib/tickets/shared-files";

const NOW = 1_800_000_000_000;

/** A stand-in for the browser's Cache Storage. */
function fakeStore() {
  const entries = new Map<string, Response>();
  const deleted: string[] = [];
  const cache = {
    keys: async () => [...entries.keys()].map((url) => new Request(`https://hub.test${url}`)),
    match: async (r: Request) => entries.get(new URL(r.url).pathname)?.clone(),
    delete: async (r: Request) => entries.delete(new URL(r.url).pathname),
  };
  return {
    entries,
    deleted,
    store: {
      open: async () => cache as unknown as Cache,
      delete: async (name: string) => {
        deleted.push(name);
        entries.clear();
        return true;
      },
    },
  };
}

const share = (name: string, type: string, at: number) =>
  new Response(new Blob(["pixels"], { type }), { headers: { "Content-Type": type, [SHARED_NAME_HEADER]: encodeURIComponent(name), [SHARED_AT_HEADER]: String(at) } });

describe("takeSharedFiles", () => {
  it("gives back each file with its name and type, in order", async () => {
    const f = fakeStore();
    f.entries.set("/shared/0", share("Screenshot 1 (home).png", "image/png", NOW));
    f.entries.set("/shared/1", share("clip.mp4", "video/mp4", NOW));
    const files = await takeSharedFiles(f.store, NOW);
    expect(files.map((x) => [x.name, x.type])).toEqual([["Screenshot 1 (home).png", "image/png"], ["clip.mp4", "video/mp4"]]);
    expect(await files[0].text()).toBe("pixels");
  });

  it("can only be collected once", async () => {
    const f = fakeStore();
    f.entries.set("/shared/0", share("a.png", "image/png", NOW));
    await takeSharedFiles(f.store, NOW);
    expect(f.deleted).toEqual([SHARED_CACHE]);
    expect(await takeSharedFiles(f.store, NOW)).toEqual([]);
  });

  it("ignores a share older than a day", async () => {
    const f = fakeStore();
    f.entries.set("/shared/0", share("old.png", "image/png", NOW - SHARED_MAX_AGE_MS - 1));
    f.entries.set("/shared/1", share("new.png", "image/png", NOW - SHARED_MAX_AGE_MS));
    expect((await takeSharedFiles(f.store, NOW)).map((x) => x.name)).toEqual(["new.png"]);
  });
});

describe("dropping shares", () => {
  it("removes only what's older than a day", async () => {
    const f = fakeStore();
    f.entries.set("/shared/0", share("old.png", "image/png", NOW - SHARED_MAX_AGE_MS - 1));
    f.entries.set("/shared/1", share("new.png", "image/png", NOW));
    await dropOldSharedFiles(f.store, NOW);
    expect([...f.entries.keys()]).toEqual(["/shared/1"]);
  });

  it("removes everything on sign-out", async () => {
    const f = fakeStore();
    f.entries.set("/shared/0", share("a.png", "image/png", NOW));
    await dropAllSharedFiles(f.store);
    expect(f.entries.size).toBe(0);
  });

  it("never throws when browser storage is unavailable", async () => {
    const broken = { open: () => Promise.reject(new Error("no")), delete: () => Promise.reject(new Error("no")) };
    await expect(dropOldSharedFiles(broken)).resolves.toBeUndefined();
    await expect(dropAllSharedFiles(broken)).resolves.toBeUndefined();
  });
});
