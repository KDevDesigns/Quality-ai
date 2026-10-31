"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CropIcon, EyeOffIcon, MoveUpRightIcon, PencilLineIcon, Redo2Icon, SquareIcon, Trash2Icon, TypeIcon, Undo2Icon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CROP_DIM, CROP_LINE, DEFAULT_MARK_COLOR, HIDE_COLOR, MARK_COLORS, TEXT_OUTLINE } from "@/lib/markup/colors";
import { encodeCanvas } from "@/lib/markup/encode";
import { markedName } from "@/lib/markup/export";
import { canRedo, canUndo, emptyHistory, push, redo, undo, type History } from "@/lib/markup/history";
import { arrowHead, cropOf, drawOrder, fontSizeFor, isTiny, normalizeRect, strokeFor, type Point, type Shape, type Tool } from "@/lib/markup/shapes";
import { IMAGE_MAX_BYTES } from "@/lib/uploads/limits";
import { cn } from "@/lib/utils";

// The screenshot markup editor (Phase 3.8). Every image added to a ticket or reply opens here before it uploads, so a
// tester can point at the problem and hide customer data first. Only the marked-up copy is uploaded; Hide replaces the
// pixels with solid black in that copy, so the hidden data never leaves the PC.

export type MarkupResult = { action: "use"; file: File } | { action: "original" } | { action: "remove" };

const TOOL_BUTTONS: { tool: Tool; label: string; key: string; icon: LucideIcon; hint?: string }[] = [
  { tool: "box", label: "Box", key: "B", icon: SquareIcon },
  { tool: "arrow", label: "Arrow", key: "A", icon: MoveUpRightIcon },
  { tool: "pen", label: "Pen", key: "P", icon: PencilLineIcon },
  { tool: "text", label: "Text", key: "T", icon: TypeIcon },
  { tool: "hide", label: "Hide", key: "H", icon: EyeOffIcon, hint: "Hide private data (black box)" },
  { tool: "crop", label: "Crop", key: "C", icon: CropIcon },
];

/** Draws one mark at image scale. `sw` is the line width and `fs` the text size for this image. */
function drawShape(ctx: CanvasRenderingContext2D, s: Shape, sw: number, fs: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = sw;
  switch (s.kind) {
    case "box":
      ctx.strokeStyle = s.color;
      ctx.strokeRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      break;
    case "arrow": {
      const [a, b] = arrowHead(s.from, s.to, sw * 5);
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(s.from.x, s.from.y);
      ctx.lineTo(s.to.x, s.to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s.to.x, s.to.y);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "pen":
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      break;
    case "text":
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      ctx.textBaseline = "top";
      // A white outline keeps the note readable on any background.
      ctx.lineWidth = Math.max(3, fs / 5);
      ctx.strokeStyle = TEXT_OUTLINE;
      ctx.strokeText(s.text, s.at.x, s.at.y);
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.at.x, s.at.y);
      break;
    case "hide":
      ctx.fillStyle = HIDE_COLOR;
      ctx.fillRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      break;
    case "crop":
      break;
  }
}

/** The marked-up image at full resolution, cropped, in the smallest format that keeps it sharp (lib/markup/encode.ts). */
async function exportImage(img: HTMLImageElement, shapes: Shape[], name: string): Promise<File> {
  const size = { w: img.naturalWidth, h: img.naturalHeight };
  const crop = cropOf(shapes, size);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.w);
  canvas.height = Math.round(crop.h);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(-crop.x, -crop.y);
  ctx.drawImage(img, 0, 0);
  for (const s of drawOrder(shapes)) drawShape(ctx, s, strokeFor(size.w), fontSizeFor(size.w));

  const out = await encodeCanvas(canvas);
  if (!out) throw new Error(`The image is still larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB. Crop it to the part that matters.`);
  return new File([out.blob], markedName(name, out.format), { type: out.format.mime });
}

type Draft = Shape | null;

export function MarkupEditor({ file, position, onDone }: { file: File | null; position: { index: number; total: number } | null; onDone: (r: MarkupResult) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState<string>(DEFAULT_MARK_COLOR);
  const [history, setHistory] = useState<History<Shape>>(emptyHistory);
  const [draft, setDraft] = useState<Draft>(null);
  const [textAt, setTextAt] = useState<Point | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState({ scale: 1, w: 0, h: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useRef<Point | null>(null);

  // A new image starts a clean editor.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setHistory(emptyHistory());
      setDraft(null);
      setTextAt(null);
      setError(null);
      setSaving(false);
    };
    image.onerror = () => setError("This image couldn't be opened. Use the original, or remove it.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Fit the image into the stage, never larger than it really is.
  const fit = useCallback(() => {
    const el = stage.current;
    if (!el || !img) return;
    const maxW = el.clientWidth;
    const maxH = Math.max(240, window.innerHeight * 0.62);
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    setView({ scale, w: Math.round(img.naturalWidth * scale), h: Math.round(img.naturalHeight * scale) });
  }, [img]);

  useEffect(() => {
    if (!img) return;
    const el = stage.current;
    // The dialog animates in; measure once it has a size, and again whenever it changes.
    const ro = el ? new ResizeObserver(fit) : null;
    if (el) ro?.observe(el);
    return () => ro?.disconnect();
  }, [img, fit]);

  // Redraw: the image, the marks (hidden areas on top) and, while editing, the crop as a dimmed frame.
  useEffect(() => {
    const c = canvas.current;
    if (!c || !img || !view.w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(view.w * dpr);
    c.height = Math.round(view.h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(view.scale * dpr, 0, 0, view.scale * dpr, 0, 0);
    ctx.drawImage(img, 0, 0);
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    const shapes = draft ? [...history.present, draft] : history.present;
    for (const s of drawOrder(shapes)) drawShape(ctx, s, strokeFor(size.w), fontSizeFor(size.w));
    const crop = cropOf(shapes, size);
    if (crop.w < size.w || crop.h < size.h) {
      ctx.fillStyle = CROP_DIM;
      ctx.beginPath();
      ctx.rect(0, 0, size.w, size.h);
      ctx.rect(crop.x, crop.y, crop.w, crop.h);
      ctx.fill("evenodd");
      ctx.setLineDash([strokeFor(size.w) * 3, strokeFor(size.w) * 2]);
      ctx.lineWidth = Math.max(1, strokeFor(size.w) / 2);
      ctx.strokeStyle = CROP_LINE;
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
      ctx.setLineDash([]);
    }
  }, [img, view, history, draft]);

  const toImage = (e: React.PointerEvent): Point => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / view.scale, y: (e.clientY - r.top) / view.scale };
  };

  const commit = (s: Shape) => {
    if (!isTiny(s)) setHistory((h) => push(h, [...h.present, s]));
  };

  function commitText() {
    if (textAt) commit({ kind: "text", at: textAt, text: text.trim(), color });
    setTextAt(null);
    setText("");
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img || saving || e.button !== 0) return;
    const p = toImage(e);
    if (tool === "text") {
      if (textAt) commitText();
      setTextAt(p);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = p;
    setDraft(tool === "pen" ? { kind: "pen", points: [p], color } : null);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const from = start.current;
    if (!from) return;
    const p = toImage(e);
    if (tool === "pen") setDraft((d) => (d?.kind === "pen" ? { ...d, points: [...d.points, p] } : d));
    else if (tool === "arrow") setDraft({ kind: "arrow", from, to: p, color });
    else if (tool === "box") setDraft({ kind: "box", rect: normalizeRect(from, p), color });
    else if (tool === "hide") setDraft({ kind: "hide", rect: normalizeRect(from, p) });
    else if (tool === "crop") setDraft({ kind: "crop", rect: normalizeRect(from, p) });
  }

  function onPointerUp() {
    if (draft) commit(draft);
    start.current = null;
    setDraft(null);
  }

  async function saveImage() {
    if (!img || !file) return;
    if (textAt) commitText();
    setSaving(true);
    setError(null);
    try {
      // Nothing drawn: the original goes as it is, with its own name.
      if (!history.present.length) return onDone({ action: "original" });
      onDone({ action: "use", file: await exportImage(img, history.present, file.name) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image couldn't be saved.");
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "z") {
      e.preventDefault();
      setHistory((h) => (e.shiftKey ? redo(h) : undo(h)));
    } else if ((e.ctrlKey || e.metaKey) && k === "y") {
      e.preventDefault();
      setHistory(redo);
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = TOOL_BUTTONS.find((b) => b.key.toLowerCase() === k);
      if (t) {
        e.preventDefault();
        setTool(t.tool);
      }
    }
  }

  const open = file !== null;
  const drawing = !!draft || !!textAt;

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        // Esc first cancels what is being drawn; Esc and a click outside never throw the markup away.
        if (details.reason === "escape-key" || details.reason === "outside-press") {
          if (drawing) {
            setDraft(null);
            setTextAt(null);
            setText("");
            start.current = null;
          }
          details.cancel();
          return;
        }
        onDone({ action: "remove" });
      }}
    >
      {open ? (
        // No corner X: it would drop the image like Remove does, with no warning. Remove is in the footer.
        <DialogContent className="sm:max-w-6xl" showCloseButton={false} onKeyDown={onKeyDown}>
          <DialogHeader>
            <DialogTitle className="truncate" title={file.name}>
              {file.name}
            </DialogTitle>
            <DialogDescription>
              {position && position.total > 1 ? `${position.index} of ${position.total} · ` : ""}
              Mark up this screenshot: point at the problem, and hide names, account numbers and amounts before it uploads.
            </DialogDescription>
          </DialogHeader>

          <div role="toolbar" aria-label="Markup tools" className="flex flex-wrap items-center gap-1.5">
            {TOOL_BUTTONS.map(({ tool: t, label, key, icon: Icon, hint }) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={tool === t ? "soft" : "ghost"}
                aria-pressed={tool === t}
                title={`${hint ?? label} (${key})`}
                onClick={() => setTool(t)}
              >
                <Icon /> {label}
              </Button>
            ))}
            <span className="mx-1 h-6 w-px bg-line2" aria-hidden />
            <div role="group" aria-label="Colour" className="flex items-center gap-1.5">
              {MARK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={color === c.value}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-7 cursor-pointer rounded-full border-2 border-card shadow-[0_0_0_0.0625rem_var(--line)] focus-visible:ring-3 focus-visible:ring-acc/30 focus-visible:outline-none",
                    color === c.value && "shadow-[0_0_0_0.125rem_var(--acc)]",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <span className="mx-1 h-6 w-px bg-line2" aria-hidden />
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)" disabled={!canUndo(history)} focusableWhenDisabled onClick={() => setHistory(undo)}>
              <Undo2Icon />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo (Ctrl+Y)" title="Redo (Ctrl+Y)" disabled={!canRedo(history)} focusableWhenDisabled onClick={() => setHistory(redo)}>
              <Redo2Icon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear all marks"
              title="Clear all marks"
              disabled={!history.present.length}
              focusableWhenDisabled
              onClick={() => setHistory((h) => push(h, []))}
            >
              <Trash2Icon />
            </Button>
          </div>

          <div ref={stage} className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-line bg-black">
            {img && view.w ? (
              <div className="relative" style={{ width: view.w, height: view.h }}>
                <canvas
                  ref={canvas}
                  aria-label="Screenshot being marked up"
                  className={cn("block touch-none", tool === "text" ? "cursor-text" : "cursor-crosshair")}
                  style={{ width: view.w, height: view.h }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                {textAt ? (
                  <input
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={commitText}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitText();
                      }
                    }}
                    aria-label="Text to add"
                    placeholder="Type, then Enter"
                    maxLength={200}
                    className="absolute h-8 min-w-40 rounded-md border border-acc bg-card px-2 text-sm text-foreground shadow-md outline-none focus-visible:ring-3 focus-visible:ring-acc/30"
                    style={{ left: Math.min(textAt.x * view.scale, view.w - 160), top: Math.min(textAt.y * view.scale, view.h - 32) }}
                  />
                ) : null}
              </div>
            ) : (
              <p role={error ? "alert" : "status"} className="p-6 text-sm text-white/70">
                {error ?? "Opening the image…"}
              </p>
            )}
          </div>

          {error && img ? (
            <p role="alert" className="text-[0.7813rem] font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onDone({ action: "remove" })} disabled={saving} className="hover:bg-bad-t hover:text-bad">
              Remove
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onDone({ action: "original" })} disabled={saving}>
                Use original
              </Button>
              <Button type="button" onClick={saveImage} disabled={saving || !img}>
                {saving ? "Saving…" : "Use image"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
