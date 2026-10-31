"use client";

import { createContext, useContext, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format";

// One image gallery for the whole ticket: the description's screenshots, then each reply's, oldest first. A thumbnail
// opens the viewer at that image; the arrow buttons or the ← → keys move through all of them, Esc closes.

export type GalleryImage = { id: string; originalName: string; size: number };

const GalleryContext = createContext<(id: string) => void>(() => {});

export function ImageGallery({ images, children }: { images: GalleryImage[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept while closing, so the dialog can animate out with its image still in it.
  const [index, setIndex] = useState(0);
  // A refresh can remove an image while the viewer is open; stay within the list.
  const at = Math.min(index, images.length - 1);
  const current = images[at];
  const hasPrev = at > 0;
  const hasNext = at < images.length - 1;
  const prev = () => hasPrev && setIndex(at - 1);
  const next = () => hasNext && setIndex(at + 1);

  function show(id: string) {
    const i = images.findIndex((img) => img.id === id);
    if (i === -1) return;
    setIndex(i);
    setOpen(true);
  }

  return (
    <GalleryContext.Provider value={show}>
      {children}
      <Dialog open={open && !!current} onOpenChange={setOpen}>
        {current ? (
          <DialogContent
            className="sm:max-w-5xl"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className="truncate" title={current.originalName}>
                {current.originalName}
              </DialogTitle>
              <DialogDescription>
                {at + 1} / {images.length} · {formatBytes(current.size)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-line bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element -- served by the auth-checked /files route, not next/image */}
              <img key={current.id} src={`/files/${current.id}`} alt={current.originalName} className="max-h-[70vh] w-auto max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3">
              {/* Focusable while disabled: at the first or last image the button stays focused, so the keys keep working. */}
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous image" disabled={!hasPrev} focusableWhenDisabled onClick={prev}>
                <ChevronLeftIcon />
              </Button>
              <a href={`/files/${current.id}`} target="_blank" rel="noopener" className="text-[0.8125rem] text-muted-foreground hover:text-acc">
                Open full size
              </a>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Next image" disabled={!hasNext} focusableWhenDisabled onClick={next}>
                <ChevronRightIcon />
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </GalleryContext.Provider>
  );
}

/** A thumbnail that opens the ticket's gallery at this image. Its caption ("name · size") is its name for screen readers. */
export function ImageThumb({ file }: { file: GalleryImage }) {
  const show = useContext(GalleryContext);
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => show(file.id)}
      className="group block w-44 cursor-pointer overflow-hidden rounded-lg border border-line bg-surface2 text-left hover:border-acc-b focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- served by the auth-checked /files route, not next/image */}
      <img src={`/files/${file.id}`} alt="" loading="lazy" className="h-28 w-full object-cover" />
      <span className="block truncate px-2 py-1 text-[0.7188rem] text-muted-foreground group-hover:text-acc" title={file.originalName}>
        {file.originalName} · {formatBytes(file.size)}
      </span>
    </button>
  );
}
