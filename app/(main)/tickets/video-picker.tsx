"use client";

import { useEffect, useRef, useState } from "react";
import { FilmIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discardUpload, UploadCancelled, uploadFile, type UploadHandle } from "@/lib/uploads/client";
import { VIDEO_MAX_BYTES, VIDEO_MAX_MB, VIDEO_MAX_SECONDS, VIDEO_TYPES } from "@/lib/uploads/limits";
import { formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

// One screen recording for a ticket or reply. It is too big for the form post, so it uploads straight to Storage as
// soon as it's picked (with progress and Cancel). The form then sends only its id in "uploadIds".

type Upload =
  | { status: "idle" }
  | { status: "uploading"; name: string; size: number; loaded: number }
  | { status: "done"; id: string; name: string; size: number; durationSec: number | null };

/** The length the browser reads from the file's headers, or null when it can't tell (e.g. a WebM recording). */
function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (d: number | null) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    const timer = setTimeout(() => done(null), 5000);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      done(Number.isFinite(v.duration) ? v.duration : null);
    };
    v.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    v.src = url;
  });
}

export function useVideoUpload() {
  const [upload, setUpload] = useState<Upload>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<UploadHandle | null>(null);
  const busy = upload.status === "uploading";

  // Leaving the page mid-upload would throw the upload away; let the browser ask first.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  async function start(file: File) {
    if (upload.status !== "idle") return setError("Only one video per post. Remove the current one first, or add another in a reply.");
    if (!VIDEO_TYPES.includes(file.type)) return setError(`${file.name} isn't an MP4 or WebM video. Snipping Tool and Xbox Game Bar (Win+Alt+R) save MP4.`);
    if (file.size > VIDEO_MAX_BYTES) return setError(`${file.name} is ${formatBytes(file.size)}. Videos can be at most ${VIDEO_MAX_MB} MB.`);
    const seconds = await probeDuration(file);
    if (seconds !== null && seconds > VIDEO_MAX_SECONDS + 0.5) {
      return setError(`${file.name} is ${formatDuration(seconds)} long. Videos can be at most ${formatDuration(VIDEO_MAX_SECONDS)}; trim it or split it.`);
    }

    setError(null);
    setUpload({ status: "uploading", name: file.name, size: file.size, loaded: 0 });
    const h = uploadFile(file, "VIDEO", (loaded) => setUpload((u) => (u.status === "uploading" ? { ...u, loaded } : u)));
    handle.current = h;
    try {
      const done = await h.done;
      setUpload({ status: "done", ...done });
    } catch (e) {
      setUpload({ status: "idle" });
      if (!(e instanceof UploadCancelled)) setError(e instanceof Error ? e.message : "The upload failed. Try again.");
    } finally {
      handle.current = null;
    }
  }

  return {
    upload,
    error,
    busy,
    start,
    cancel: () => handle.current?.cancel(),
    /** Drops an uploaded video that hasn't been sent; the server deletes the file. */
    remove: () => {
      if (upload.status === "done") void discardUpload(upload.id);
      setUpload({ status: "idle" });
      setError(null);
    },
    /** After the post went through: the video now belongs to it, so just forget it here. */
    clear: () => {
      setUpload({ status: "idle" });
      setError(null);
    },
  };
}

export type VideoUpload = ReturnType<typeof useVideoUpload>;

export function VideoPicker({ state, id = "video", compact }: { state: VideoUpload; id?: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const { upload } = state;
  const pct = upload.status === "uploading" && upload.size ? Math.min(100, Math.round((upload.loaded / upload.size) * 100)) : 0;

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
        const f = e.dataTransfer.files[0];
        if (f) void state.start(f);
      }}
    >
      {upload.status === "done" ? <input type="hidden" name="uploadIds" value={upload.id} /> : null}

      {upload.status === "idle" ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(id)?.click()}>
            <FilmIcon /> Add video
          </Button>
          <input
            id={id}
            type="file"
            accept={VIDEO_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void state.start(f);
            }}
          />
          <span className="text-[12.5px] text-muted-foreground">
            {compact ? `One MP4 or WebM, up to 3 min / ${VIDEO_MAX_MB} MB.` : `A screen recording: one MP4 or WebM, up to 3 min and ${VIDEO_MAX_MB} MB. You can also drop it here.`}
          </span>
        </div>
      ) : upload.status === "uploading" ? (
        <div className="grid gap-1.5">
          <div className="flex items-center gap-3 text-[13px]">
            <FilmIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate" title={upload.name}>
              Uploading {upload.name}… {pct}% of {formatBytes(upload.size)}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={state.cancel}>
              Cancel
            </Button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface3" role="progressbar" aria-label="Video upload" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-acc transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-[13px]">
          <FilmIcon className="size-4 shrink-0 text-acc" aria-hidden />
          <span className="min-w-0 flex-1 truncate" title={upload.name}>
            {upload.name}
            <span className="text-muted-foreground">
              {" "}
              · {upload.durationSec !== null ? `${formatDuration(upload.durationSec)} · ` : ""}
              {formatBytes(upload.size)} · ready
            </span>
          </span>
          <button
            type="button"
            onClick={state.remove}
            aria-label={`Remove ${upload.name}`}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface3 hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {state.error ? (
        <p role="alert" className="text-[12.5px] font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
