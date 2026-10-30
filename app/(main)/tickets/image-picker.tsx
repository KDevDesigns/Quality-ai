"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discardUpload, UploadCancelled, uploadFile, type UploadHandle } from "@/lib/uploads/client";
import { IMAGE_MAX_BYTES, IMAGE_TYPES, MAX_IMAGES_PER_POST } from "@/lib/uploads/limits";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

// Images for a ticket or comment: pick them, drop them, or paste a screenshot (Ctrl+V) into the text box.
// Each one uploads straight to Storage as soon as it's added; the form then sends only their ids in "uploadIds".

type Item = {
  key: number;
  name: string;
  size: number;
  preview: string;
  loaded: number;
  /** Set once the server has checked the arrived file. */
  id: string | null;
  handle: UploadHandle | null;
};

let nextKey = 0;

export function useImageAttachments() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const live = useRef<Item[]>([]);
  useEffect(() => {
    live.current = items;
  }, [items]);
  const busy = items.some((i) => !i.id);

  // Leaving the page mid-upload would throw the upload away; let the browser ask first.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // When the form goes away: stop uploads still running (they could never be sent) and free the blob previews.
  useEffect(
    () => () =>
      live.current.forEach((i) => {
        i.handle?.cancel();
        URL.revokeObjectURL(i.preview);
      }),
    [],
  );

  const update = (key: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const drop = (key: number) =>
    setItems((list) => {
      const gone = list.find((i) => i.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return list.filter((i) => i.key !== key);
    });

  function start(file: File) {
    const key = nextKey++;
    const handle = uploadFile(file, "IMAGE", (loaded) => update(key, { loaded }));
    setItems((list) => [...list, { key, name: file.name, size: file.size, preview: URL.createObjectURL(file), loaded: 0, id: null, handle }]);
    handle.done.then(
      (done) => update(key, { id: done.id, handle: null, loaded: file.size }),
      (e) => {
        drop(key);
        if (e instanceof UploadCancelled) return;
        // Several images upload at once, so say which one this was.
        const message = e instanceof Error ? e.message : "It couldn't be uploaded. Try again.";
        setError(message.includes(file.name) ? message : `${file.name}: ${message}`);
      },
    );
  }

  function add(list: Iterable<File>) {
    const incoming = [...list];
    const images = incoming.filter((f) => IMAGE_TYPES.includes(f.type));
    const tooBig = images.filter((f) => f.size > IMAGE_MAX_BYTES);
    const ok = images.filter((f) => f.size <= IMAGE_MAX_BYTES);
    const room = MAX_IMAGES_PER_POST - items.length;
    ok.slice(0, Math.max(0, room)).forEach(start);
    if (images.length < incoming.length) setError("Only PNG, JPEG, WebP and GIF images go here. Add a recording with Add video.");
    else if (tooBig.length) setError(`${tooBig.map((f) => f.name).join(", ")} is larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
    else if (ok.length > room) setError(`At most ${MAX_IMAGES_PER_POST} images per post.`);
    else setError(null);
  }

  function onPaste(e: React.ClipboardEvent) {
    const pasted = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
    if (!pasted.length) return;
    e.preventDefault();
    // Screenshots arrive as "image.png"; give them a name that says when they were taken.
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    add(pasted.map((f, i) => new File([f], `screenshot-${stamp}${pasted.length > 1 ? `-${i + 1}` : ""}.${f.type.split("/")[1] ?? "png"}`, { type: f.type })));
  }

  return {
    items,
    error,
    busy,
    add,
    onPaste,
    /** Cancels an upload in progress, or drops an uploaded image that hasn't been sent (the server deletes it). */
    remove: (key: number) => {
      const item = items.find((i) => i.key === key);
      if (!item) return;
      if (item.handle) item.handle.cancel();
      else if (item.id) void discardUpload(item.id);
      drop(key);
    },
    /** After the post went through: the images now belong to it, so just forget them here. */
    clear: () => {
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setItems([]);
      setError(null);
    },
  };
}

export type ImageAttachments = ReturnType<typeof useImageAttachments>;

export function ImagePicker({ state, id = "images", compact }: { state: ImageAttachments; id?: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn("grid gap-2.5 rounded-[10px] border border-dashed border-line p-3 transition-colors", over && "border-acc bg-acc-t2")}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        state.add(e.dataTransfer.files);
      }}
    >
      {state.items.map((i) => (i.id ? <input key={i.key} type="hidden" name="uploadIds" value={i.id} /> : null))}
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          state.add([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={state.items.length >= MAX_IMAGES_PER_POST}>
          <ImagePlusIcon /> Add images
        </Button>
        <span className="text-[12.5px] text-muted-foreground">
          {compact ? "Or paste a screenshot (Ctrl+V)." : "Or paste a screenshot (Ctrl+V) into the text box, or drop files here."} Up to {MAX_IMAGES_PER_POST},{" "}
          {IMAGE_MAX_BYTES / 1024 / 1024} MB each.
        </span>
      </div>
      {state.items.length ? (
        <ul className="flex flex-wrap gap-2.5">
          {state.items.map((i) => {
            const pct = i.size ? Math.min(100, Math.round((i.loaded / i.size) * 100)) : 0;
            return (
              <li key={i.key} className="relative w-32 overflow-hidden rounded-lg border border-line bg-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview */}
                <img src={i.preview} alt="" className={cn("h-20 w-full object-cover", !i.id && "opacity-60")} />
                {!i.id ? (
                  <div className="h-1.5 overflow-hidden bg-surface3" role="progressbar" aria-label={`Uploading ${i.name}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-acc transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                ) : null}
                <div className="truncate px-2 py-1 text-[11.5px] text-muted-foreground" title={i.name}>
                  {i.id ? formatBytes(i.size) : `${pct}%`} · {i.name}
                </div>
                <button
                  type="button"
                  onClick={() => state.remove(i.key)}
                  aria-label={i.id ? `Remove ${i.name}` : `Cancel uploading ${i.name}`}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-[12.5px] font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
