"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ImagePlusIcon, MonitorIcon, PencilIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discardUpload, UploadCancelled, uploadFile, type UploadHandle } from "@/lib/uploads/client";
import { IMAGE_MAX_BYTES, IMAGE_TYPES, MAX_IMAGES_PER_POST } from "@/lib/uploads/limits";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MarkupEditor, type MarkupResult } from "./markup/markup-editor";

// Images for a ticket or comment: pick them, drop them, paste a screenshot (Ctrl+V) or capture a tab or window.
// Each one opens in the markup editor first (one at a time), then uploads straight to Storage; the form sends only
// their ids in "uploadIds". Edit reopens an added image and replaces its upload.

type Item = {
  key: number;
  /** Kept so Edit can reopen the image in the markup editor. */
  file: File;
  name: string;
  size: number;
  preview: string;
  loaded: number;
  /** Set once the server has checked the arrived file. */
  id: string | null;
  handle: UploadHandle | null;
};

/** An image waiting in the markup editor. With `replaceKey` it is an added image being edited again. */
type Queued = { file: File; replaceKey?: number };

let nextKey = 0;

/** One frame of a tab, window or screen the person picks, or null when they cancel the browser's prompt. */
async function captureFrame(): Promise<File | null> {
  let stream: MediaStream;
  try {
    // Chrome/Edge-only hints: offer other tabs and windows, not QA Hub's own tab.
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: false, selfBrowserSurface: "exclude" } as DisplayMediaStreamOptions);
  } catch {
    return null;
  }
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    // Wait for a painted frame; the first one can still be blank.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return null;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    return new File([blob], `capture-${stamp}.png`, { type: "image/png" });
  } finally {
    // Stop sharing at once; only the one frame is kept.
    stream.getTracks().forEach((t) => t.stop());
  }
}

export const canCaptureScreen = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

/** Whether this browser can capture a tab or window. False while hydrating, like the server render, then the real answer. */
const useCanCapture = () => useSyncExternalStore(() => () => {}, canCaptureScreen, () => false);

export function useImageAttachments() {
  const [items, setItems] = useState<Item[]>([]);
  const [queue, setQueue] = useState<Queued[]>([]);
  // How many images the current run through the editor started with, for "2 of 3".
  const [batch, setBatch] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const live = useRef<Item[]>([]);
  useEffect(() => {
    live.current = items;
  }, [items]);
  // Images still in the editor count as busy too: the post can't go without them.
  const busy = items.some((i) => !i.id) || queue.length > 0;

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
    setItems((list) => [...list, { key, file, name: file.name, size: file.size, preview: URL.createObjectURL(file), loaded: 0, id: null, handle }]);
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
    const room = MAX_IMAGES_PER_POST - items.length - queue.length;
    enqueue(ok.slice(0, Math.max(0, room)).map((file) => ({ file })));
    if (images.length < incoming.length) setError("Only PNG, JPEG, WebP and GIF images go here. Add a recording with Add video.");
    else if (tooBig.length) setError(`${tooBig.map((f) => f.name).join(", ")} is larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
    else if (ok.length > room) setError(`At most ${MAX_IMAGES_PER_POST} images per post.`);
    else setError(null);
  }

  /** A paste into the screenshot box, the page, or a reply's text box. Works with React's and the browser's paste event. */
  function onPaste(e: { clipboardData: DataTransfer | null; preventDefault(): void }) {
    const pasted = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!pasted.length) return;
    e.preventDefault();
    // Screenshots arrive as "image.png"; give them a name that says when they were taken.
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    add(pasted.map((f, i) => new File([f], `screenshot-${stamp}${pasted.length > 1 ? `-${i + 1}` : ""}.${f.type.split("/")[1] ?? "png"}`, { type: f.type })));
  }

  function enqueue(entries: Queued[]) {
    if (!entries.length) return;
    setBatch((n) => (queue.length ? n + entries.length : entries.length));
    setQueue((q) => [...q, ...entries]);
  }

  /** Cancels an upload in progress, or drops an uploaded image that hasn't been sent (the server deletes it). */
  function remove(key: number) {
    const item = live.current.find((i) => i.key === key);
    if (!item) return;
    if (item.handle) item.handle.cancel();
    else if (item.id) void discardUpload(item.id);
    drop(key);
  }

  /** What the editor decided for the image at the front of the queue. */
  function resolve(result: MarkupResult) {
    const [head] = queue;
    if (!head) return;
    setQueue((q) => q.slice(1));
    if (result.action === "remove") {
      if (head.replaceKey !== undefined) remove(head.replaceKey);
      return;
    }
    if (result.action === "original") {
      // Editing an added image and keeping it as it was: nothing to redo.
      if (head.replaceKey === undefined) start(head.file);
      return;
    }
    if (result.file.size > IMAGE_MAX_BYTES) {
      setError(`${result.file.name} is larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    if (head.replaceKey !== undefined) remove(head.replaceKey);
    start(result.file);
  }

  return {
    items,
    error,
    busy,
    add,
    onPaste,
    /** The image in the markup editor now, and where it is in the run ("2 of 3"). */
    editing: queue[0] ?? null,
    position: queue.length ? { index: batch - queue.length + 1, total: batch } : null,
    resolve,
    /** Reopens an added image in the editor; saving replaces its upload. */
    edit: (key: number) => {
      const item = items.find((i) => i.key === key);
      if (item) enqueue([{ file: item.file, replaceKey: key }]);
    },
    /** Grabs one frame of a tab or window the person picks and opens it in the editor. */
    capture: async () => {
      if (items.length + queue.length >= MAX_IMAGES_PER_POST) return setError(`At most ${MAX_IMAGES_PER_POST} images per post.`);
      const file = await captureFrame();
      if (file) add([file]);
    },
    remove,
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
  const canCapture = useCanCapture();
  const full = state.items.length >= MAX_IMAGES_PER_POST;

  // Ctrl+V anywhere on the page that isn't a text field lands here too, so a fresh Win+Shift+S can be pasted without
  // clicking first. Pastes into a field (or already handled, e.g. by this box) are left alone.
  const latestPaste = useRef(state.onPaste);
  useEffect(() => {
    latestPaste.current = state.onPaste;
  });
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (e.defaultPrevented || el?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='dialog']")) return;
      latestPaste.current(e);
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, []);

  return (
    <div
      // Focusable, so clicking it and pressing Ctrl+V pastes here.
      tabIndex={0}
      role="group"
      aria-label="Screenshots"
      onPaste={state.onPaste}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button, input, a")) e.currentTarget.focus();
      }}
      className={cn(
        // Focused: a solid outline (ready for Ctrl+V). Dragging a file over keeps its own look, the filled box.
        "grid cursor-default gap-2.5 rounded-[10px] border border-dashed border-line p-3 transition-colors outline-none focus:border-solid focus:border-acc-b focus-visible:ring-3 focus-visible:ring-acc/30",
        over && "border-acc bg-acc-t2",
      )}
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
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={full}>
          <ImagePlusIcon /> Add images
        </Button>
        {canCapture ? (
          <Button type="button" variant="outline" size="sm" onClick={state.capture} disabled={full} title="Capture a tab or window, such as the ERP">
            <MonitorIcon /> Capture screen
          </Button>
        ) : null}
        <span className="text-[12.5px] text-muted-foreground">
          {compact ? "Or paste a screenshot (Ctrl+V) into your message or this box." : "Or click this box and paste a screenshot (Ctrl+V), or drop images here."} Each
          one opens in the markup tools first. Up to {MAX_IMAGES_PER_POST}, {IMAGE_MAX_BYTES / 1024 / 1024} MB each.
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
                {i.id ? (
                  <button
                    type="button"
                    onClick={() => state.edit(i.key)}
                    aria-label={`Mark up ${i.name} again`}
                    title="Mark up again"
                    className="absolute top-1 right-8 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => state.remove(i.key)}
                  aria-label={i.id ? `Remove ${i.name}` : `Cancel uploading ${i.name}`}
                  title={i.id ? "Remove" : "Cancel upload"}
                  className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
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
      <MarkupEditor file={state.editing?.file ?? null} position={state.position} onDone={state.resolve} />
    </div>
  );
}
