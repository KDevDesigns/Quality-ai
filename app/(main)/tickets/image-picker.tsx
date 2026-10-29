"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

// Images for a ticket or comment: pick them, drop them, or paste a screenshot (Ctrl+V) into the text box.
// The chosen files are mirrored into a real <input type="file" name="images">, so the form posts them as usual.

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILES = 6;
const MAX_BYTES = 10 * 1024 * 1024;

export function useImageAttachments() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function add(list: Iterable<File>) {
    const incoming = [...list];
    const images = incoming.filter((f) => ACCEPT.includes(f.type));
    const tooBig = images.filter((f) => f.size > MAX_BYTES);
    const ok = images.filter((f) => f.size <= MAX_BYTES);
    const next = [...files, ...ok].slice(0, MAX_FILES);
    setFiles(next);
    if (images.length < incoming.length) setError("Only PNG, JPEG, WebP and GIF images go here. Add a recording with Add video.");
    else if (tooBig.length) setError(`${tooBig.map((f) => f.name).join(", ")} is larger than 10 MB.`);
    else if (files.length + ok.length > MAX_FILES) setError(`At most ${MAX_FILES} images per post.`);
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
    files,
    error,
    add,
    onPaste,
    remove: (i: number) => setFiles(files.filter((_, j) => j !== i)),
    clear: () => {
      setFiles([]);
      setError(null);
    },
  };
}

export type ImageAttachments = ReturnType<typeof useImageAttachments>;

export function ImagePicker({ state, id = "images", compact }: { state: ImageAttachments; id?: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { files } = state;
  useEffect(() => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }, [files]);
  const previews = useMemo(() => state.files.map((f) => URL.createObjectURL(f)), [state.files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

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
      <input
        ref={inputRef}
        id={id}
        type="file"
        name="images"
        multiple
        accept={ACCEPT.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          // The picker replaces input.files; add the new picks to the list instead, and the effect re-syncs the input.
          const picked = [...(e.target.files ?? [])];
          state.add(picked);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={state.files.length >= MAX_FILES}>
          <ImagePlusIcon /> Add images
        </Button>
        <span className="text-[12.5px] text-muted-foreground">
          {compact ? "Or paste a screenshot (Ctrl+V)." : "Or paste a screenshot (Ctrl+V) into the text box, or drop files here."} Up to {MAX_FILES}, 10 MB each.
        </span>
      </div>
      {state.files.length ? (
        <ul className="flex flex-wrap gap-2.5">
          {state.files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="relative w-32 overflow-hidden rounded-lg border border-line bg-surface2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview */}
              <img src={previews[i]} alt="" className="h-20 w-full object-cover" />
              <div className="truncate px-2 py-1 text-[11.5px] text-muted-foreground" title={f.name}>
                {formatBytes(f.size)} · {f.name}
              </div>
              <button
                type="button"
                onClick={() => state.remove(i)}
                aria-label={`Remove ${f.name}`}
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
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
