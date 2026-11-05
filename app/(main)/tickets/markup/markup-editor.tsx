"use client";

import { XIcon } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { CROP_DIM, CROP_LINE, DEFAULT_MARK_COLOR, MARK_COLORS, ON_MARK, TEXT_OUTLINE } from "@/lib/markup/colors";
import { canvasMeasure, drawSelection, drawShape, FONT } from "@/lib/markup/draw";
import { encodeCanvas } from "@/lib/markup/encode";
import { markedName } from "@/lib/markup/export";
import { handleAt, hitTest, LINE, move, resize, type Handle, type Measure } from "@/lib/markup/geometry";
import { canRedo, canUndo, emptyHistory, push, redo, undo, type History } from "@/lib/markup/history";
import {
  clampFont,
  cropOf,
  DEFAULT_TEXT_SIZE,
  drawOrder,
  fontOf,
  isTiny,
  nextStep,
  normalizeRect,
  strokeFor,
  TEXT_SIZES,
  textFontSize,
  type Point,
  type Shape,
  type TextSize,
  type Tool,
} from "@/lib/markup/shapes";
import { clampZoom, pinchZoom, ZOOM_STEP, zoomAt } from "@/lib/markup/view";
import { IMAGE_MAX_BYTES } from "@/lib/uploads/limits";
import { cn } from "@/lib/utils";
import { MarkupToolbar } from "./markup-toolbar";
import { toolForKey } from "./shortcuts";

// The screenshot markup editor (Phase 3.8). Every image added to a ticket or reply opens here before it uploads, so a
// tester can point at the problem and hide customer data first. Only the marked-up copy is uploaded; Hide replaces the
// pixels with solid black in that copy, so the hidden data never leaves the PC.

export type MarkupResult = { action: "use"; file: File } | { action: "original" } | { action: "remove" };

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
  const measure = canvasMeasure(ctx);
  for (const s of drawOrder(shapes)) drawShape(ctx, s, size.w, measure);

  const out = await encodeCanvas(canvas);
  if (!out) throw new Error(`The image is still larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB. Crop it to the part that matters.`);
  return new File([out.blob], markedName(name, out.format), { type: out.format.mime });
}

/** A note or callout being typed; `index` is the mark being retyped, null for a new one. */
type TextEdit = { kind: "text" | "callout"; at: Point; tip?: Point; index: number | null; color: string; fontPx: number };

type Drag =
  | { mode: "draw"; from: Point }
  | { mode: "callout"; tip: Point }
  | { mode: "move"; index: number; from: Point; start: Shape }
  | { mode: "resize"; index: number; handle: Handle; start: Shape }
  | { mode: "pan"; client: Point; scroll: Point }
  // A finger on a tool that acts on one tap: it waits for the lift, in case this is the start of a pinch.
  | { mode: "tap"; at: Point };

/** Two fingers on the screenshot: where they started, and how far apart. */
type Pinch = { distance: number; scale: number; middle: Point };

const middleOf = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const hasText = (s: Shape | undefined): s is Extract<Shape, { kind: "text" | "step" | "callout" }> => s?.kind === "text" || s?.kind === "step" || s?.kind === "callout";

/** How close a click must be to a line or a handle, in screen pixels. */
const GRAB_PX = 8;

export function MarkupEditor({
  file,
  position,
  isEdit = false,
  onDone,
}: {
  file: File | null;
  position: { index: number; total: number } | null;
  /** Re-opening an image already added: leaving keeps it as it was. A new image is left out instead. */
  isEdit?: boolean;
  onDone: (r: MarkupResult) => void;
}) {
  const mobile = useIsMobile();
  /** The image the "Leave?" question was asked for; a new image in the run starts without it. */
  const [leavingFor, setLeavingFor] = useState<File | null>(null);
  const leaving = !!file && leavingFor === file;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState<string>(DEFAULT_MARK_COLOR);
  const [textSize, setTextSize] = useState<TextSize>(DEFAULT_TEXT_SIZE);
  const [history, setHistory] = useState<History<Shape>>(emptyHistory);
  const [draft, setDraft] = useState<Shape | null>(null);
  /** A mark being moved or resized, shown in place of the saved one until the drag ends. */
  const [live, setLive] = useState<{ index: number; shape: Shape } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [edit, setEdit] = useState<TextEdit | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fit, setFit] = useState(0);
  const [scale, setScale] = useState(0);
  const [stageH, setStageH] = useState(360);
  const [help, setHelp] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const drag = useRef<Drag | null>(null);
  /** Fingers on the screenshot now, by pointer id. */
  const fingers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const pendingScroll = useRef<Point | null>(null);
  const measureRef = useRef<Measure | null>(null);

  const W = img?.naturalWidth ?? 1;
  const present = history.present;
  const measure: Measure = (t, px) => (measureRef.current ??= canvasMeasure(document.createElement("canvas").getContext("2d")!))(t, px);
  const presetPx = textFontSize(W, textSize);

  const focusText = () => requestAnimationFrame(() => textInput.current?.focus());
  useEffect(() => {
    if (edit) focusText();
  }, [edit]);

  // A new image starts a clean editor.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setHistory(emptyHistory());
      setDraft(null);
      setLive(null);
      setSelected(null);
      setEdit(null);
      setText("");
      setScale(0);
      setError(null);
      setSaving(false);
      fingers.current.clear();
      pinch.current = null;
    };
    image.onerror = () => setError("This image couldn't be opened. Use the original, or remove it.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Fit the image into the stage, never larger than it really is. Zoomed views keep their zoom when the window resizes.
  const measureFit = useCallback(() => {
    const el = stage.current;
    if (!el || !img) return;
    // Phones: the editor fills the screen and the stage takes all the height the tools leave.
    const h = mobile ? el.clientHeight : Math.round(Math.max(240, window.innerHeight * 0.62));
    if (!h) return;
    const f = Math.min(1, el.clientWidth / img.naturalWidth, h / img.naturalHeight);
    setStageH(h);
    setFit((old) => {
      setScale((s) => (s === 0 || s === old ? f : clampZoom(s, f, img.naturalWidth, window.devicePixelRatio || 1)));
      return f;
    });
  }, [img, mobile]);

  useEffect(() => {
    if (!img) return;
    const el = stage.current;
    // The dialog animates in; measure once it has a size, and again whenever it changes.
    const ro = el ? new ResizeObserver(measureFit) : null;
    if (el) ro?.observe(el);
    return () => ro?.disconnect();
  }, [img, measureFit]);

  // After a zoom, scroll so the point under the cursor stays put (see zoomAt).
  useLayoutEffect(() => {
    const el = stage.current;
    const to = pendingScroll.current;
    if (!el || !to) return;
    el.scrollLeft = to.x;
    el.scrollTop = to.y;
    pendingScroll.current = null;
  }, [scale]);

  function zoomTo(target: number, cursor?: Point) {
    const el = stage.current;
    if (!el || !img || !scale) return;
    const next = clampZoom(target, fit, img.naturalWidth, window.devicePixelRatio || 1);
    if (Math.abs(next - scale) < 1e-4) return;
    pendingScroll.current = zoomAt({
      scale,
      next,
      image: { w: img.naturalWidth, h: img.naturalHeight },
      stage: { w: el.clientWidth, h: el.clientHeight },
      scroll: { x: el.scrollLeft, y: el.scrollTop },
      cursor: cursor ?? { x: el.clientWidth / 2, y: el.clientHeight / 2 },
    });
    setScale(next);
  }
  // The wheel listener below is added once; these let it reach the current zoom.
  const zoomRef = useRef(zoomTo);
  const currentScale = useRef(scale);
  useEffect(() => {
    zoomRef.current = zoomTo;
    currentScale.current = scale;
  });

  // Ctrl + wheel (and a laptop pinch, which arrives as Ctrl + wheel) zooms the screenshot, not the page. React's wheel
  // listener is passive and can't stop the page zoom, so this one is added by hand.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.002));
      zoomRef.current(currentScale.current * factor, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [img]);

  /** What's on screen: the saved marks with a drag in progress applied, without the one being retyped, plus a draft. */
  const shown = (): Shape[] => {
    const list = present.map((s, i) => (live && live.index === i ? live.shape : s)).filter((_, i) => !(edit && edit.index === i));
    return draft ? [...list, draft] : list;
  };

  // Redraw: the image, the marks (highlights under, hidden areas on top), the crop as a dimmed frame, the selection.
  useEffect(() => {
    const c = canvas.current;
    if (!c || !img || !scale) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(img.naturalWidth * scale * dpr);
    c.height = Math.round(img.naturalHeight * scale * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.drawImage(img, 0, 0);
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    const shapes = shown();
    const m = canvasMeasure(ctx);
    for (const s of drawOrder(shapes)) drawShape(ctx, s, size.w, m);
    const crop = cropOf(shapes, size);
    if (crop.w < size.w || crop.h < size.h) {
      const sw = strokeFor(size.w);
      ctx.fillStyle = CROP_DIM;
      ctx.beginPath();
      ctx.rect(0, 0, size.w, size.h);
      ctx.rect(crop.x, crop.y, crop.w, crop.h);
      ctx.fill("evenodd");
      ctx.setLineDash([sw * 3, sw * 2]);
      ctx.lineWidth = Math.max(1, sw / 2);
      ctx.strokeStyle = CROP_LINE;
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
      ctx.setLineDash([]);
    }
    const sel = selected !== null && edit?.index !== selected ? (live?.index === selected ? live.shape : present[selected]) : undefined;
    if (sel) drawSelection(ctx, sel, size.w, scale, m);
    // shown() reads the same state as the dependencies below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, scale, history, draft, live, selected, edit]);

  const toImage = (e: { clientX: number; clientY: number }): Point => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };

  // ── Changing the marks; each call is one Undo step ──
  const add = (s: Shape) => {
    if (!isTiny(s)) setHistory((h) => push(h, [...h.present, s]));
  };
  const replaceAt = (i: number, s: Shape) => setHistory((h) => push(h, h.present.map((x, j) => (j === i ? s : x))));
  const removeAt = (i: number) => setHistory((h) => push(h, h.present.filter((_, j) => j !== i)));
  const changeHistory = (f: (h: History<Shape>) => History<Shape>) => {
    setSelected(null);
    setLive(null);
    setHistory(f);
  };

  /** The note being typed as a mark, or null while it's empty. */
  const typed = (): Shape | null => {
    if (!edit || !text.trim()) return null;
    const base = { at: edit.at, text: text.trim(), color: edit.color, fontPx: edit.fontPx };
    return edit.kind === "callout" ? { kind: "callout", tip: edit.tip!, ...base } : { kind: "text", ...base };
  };

  /** Puts the note on the image (or retypes the mark). Empty text removes a retyped mark and drops a new one. */
  function commitEdit() {
    if (!edit) return;
    const s = typed();
    if (edit.index !== null) {
      if (s) replaceAt(edit.index, s);
      else removeAt(edit.index);
    } else if (s) add(s);
    setEdit(null);
    setText("");
  }

  function retype(i: number) {
    const s = present[i];
    if (s?.kind !== "text" && s?.kind !== "callout") return;
    setSelected(null);
    setEdit({ kind: s.kind, at: s.at, tip: s.kind === "callout" ? s.tip : undefined, index: i, color: s.color, fontPx: fontOf(s, W) });
    setText(s.text);
  }

  function pickTool(t: Tool) {
    if (edit) commitEdit();
    if (t !== "select") setSelected(null);
    setTool(t);
  }

  function pickColor(c: string) {
    setColor(c);
    if (edit) {
      setEdit({ ...edit, color: c });
      focusText();
    } else if (selected !== null) {
      const s = present[selected];
      if (s && "color" in s) replaceAt(selected, { ...s, color: c });
    }
  }

  /** Text size from a size button. */
  function pickSize(id: TextSize) {
    setTextSize(id);
    applyFont(textFontSize(W, id));
  }

  function applyFont(px: number) {
    if (edit) {
      setEdit({ ...edit, fontPx: clampFont(px) });
      focusText();
    } else if (selected !== null && hasText(present[selected])) {
      replaceAt(selected, { ...present[selected], fontPx: clampFont(px) } as Shape);
    }
  }

  /** [ and ]: the selected or typed text a step smaller or bigger; otherwise the size for the next one. */
  function bumpSize(dir: 1 | -1) {
    const sel = selected !== null ? present[selected] : undefined;
    if (edit) applyFont(edit.fontPx * (dir > 0 ? 1.2 : 1 / 1.2));
    else if (hasText(sel)) applyFont(fontOf(sel, W) * (dir > 0 ? 1.2 : 1 / 1.2));
    else {
      const i = TEXT_SIZES.findIndex((s) => s.id === textSize);
      setTextSize(TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, i + dir))].id);
    }
  }

  // ── Pointer ──
  // Fingers are followed on the stage, before the canvas sees them, so a pinch also works with a finger on the black
  // bars beside a tall screenshot. A second finger drops whatever the first had started; until both lift it's zoom and move.
  function onFingerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.current.size !== 2) return;
    const [a, b] = [...fingers.current.values()];
    drag.current = null;
    setDraft(null);
    setLive(null);
    pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale, middle: middleOf(a, b) };
  }

  function onFingerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current) {
      movePinch(pinch.current);
      e.stopPropagation();
    }
  }

  function onFingerUp(e: React.PointerEvent<HTMLDivElement>) {
    fingers.current.delete(e.pointerId);
    if (!pinch.current) return;
    if (!fingers.current.size) pinch.current = null;
    e.stopPropagation();
  }

  function movePinch(p: Pinch) {
    const [a, b] = [...fingers.current.values()];
    if (!a || !b) return;
    const el = stage.current!;
    const middle = middleOf(a, b);
    el.scrollLeft -= middle.x - p.middle.x;
    el.scrollTop -= middle.y - p.middle.y;
    p.middle = middle;
    const r = el.getBoundingClientRect();
    zoomTo(pinchZoom(p.scale, p.distance, Math.hypot(a.x - b.x, a.y - b.y)), { x: middle.x - r.left, y: middle.y - r.top });
  }

  function placeText(p: Point, tol: number) {
    const i = hitTest(present, p, W, tol, measure);
    if (i >= 0 && present[i].kind === "text") retype(i);
    else setEdit({ kind: "text", at: p, index: null, color, fontPx: presetPx });
    setText("");
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img || saving || pinch.current) return;
    const el = stage.current!;
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { mode: "pan", client: { x: e.clientX, y: e.clientY }, scroll: { x: el.scrollLeft, y: el.scrollTop } };
      return;
    }
    if (e.button !== 0) return;
    const p = toImage(e);
    const tol = GRAB_PX / scale;
    if (edit) commitEdit();

    if (tool === "select") {
      const sel = selected !== null ? present[selected] : undefined;
      const handle = sel ? handleAt(sel, p, W, tol, measure) : null;
      if (sel && handle) {
        drag.current = { mode: "resize", index: selected!, handle, start: sel };
      } else {
        const i = hitTest(present, p, W, tol, measure);
        setSelected(i >= 0 ? i : null);
        if (i >= 0) drag.current = { mode: "move", index: i, from: p, start: present[i] };
      }
      if (drag.current) e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if ((tool === "text" || tool === "step") && e.pointerType === "touch") {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { mode: "tap", at: p };
      return;
    }
    if (tool === "text") {
      e.preventDefault();
      placeText(p, tol);
      return;
    }
    if (tool === "step") {
      add({ kind: "step", at: p, n: nextStep(present), color, fontPx: presetPx });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "callout") {
      drag.current = { mode: "callout", tip: p };
      return;
    }
    drag.current = { mode: "draw", from: p };
    setDraft(tool === "pen" ? { kind: "pen", points: [p], color } : null);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    if (!d || d.mode === "tap") return;
    if (d.mode === "pan") {
      const el = stage.current!;
      el.scrollLeft = d.scroll.x - (e.clientX - d.client.x);
      el.scrollTop = d.scroll.y - (e.clientY - d.client.y);
      return;
    }
    const p = toImage(e);
    if (d.mode === "move") setLive({ index: d.index, shape: move(d.start, p.x - d.from.x, p.y - d.from.y) });
    else if (d.mode === "resize") setLive({ index: d.index, shape: resize(d.start, d.handle, p, W, measure) });
    else if (d.mode === "callout") setDraft({ kind: "arrow", from: p, to: d.tip, color });
    else if (tool === "pen") setDraft((s) => (s?.kind === "pen" ? { ...s, points: [...s.points, p] } : s));
    else if (tool === "arrow") setDraft({ kind: "arrow", from: d.from, to: p, color });
    else if (tool === "box" || tool === "ellipse") setDraft({ kind: tool, rect: normalizeRect(d.from, p), color });
    else if (tool === "highlight" || tool === "hide" || tool === "crop") setDraft({ kind: tool, rect: normalizeRect(d.from, p) });
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.mode === "pan") return;
    // The system took the touch away (a call, a gesture): nothing half-done is kept.
    if (e.type === "pointercancel") {
      setDraft(null);
      setLive(null);
      return;
    }
    if (d.mode === "tap") {
      if (tool === "text") placeText(d.at, GRAB_PX / scale);
      else add({ kind: "step", at: d.at, n: nextStep(present), color, fontPx: presetPx });
      return;
    }
    if (d.mode === "move" || d.mode === "resize") {
      if (live) replaceAt(d.index, live.shape);
      setLive(null);
      return;
    }
    if (d.mode === "callout") {
      setDraft(null);
      const p = toImage(e);
      // A click without a drag puts the note a little below and to the right of the point.
      const at = Math.hypot(p.x - d.tip.x, p.y - d.tip.y) > 12 / scale ? p : { x: d.tip.x + presetPx * 2, y: d.tip.y + presetPx * 1.5 };
      setEdit({ kind: "callout", tip: d.tip, at, index: null, color, fontPx: presetPx });
      setText("");
      return;
    }
    if (draft) add(draft);
    setDraft(null);
  }

  function onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== "select" || !img) return;
    const i = hitTest(present, toImage(e), W, GRAB_PX / scale, measure);
    if (i >= 0) retype(i);
  }

  async function saveImage() {
    if (!img || !file) return;
    // Read the typed note directly: committing it only updates history on the next render.
    const t = typed();
    let shapes = present;
    if (edit?.index != null) shapes = t ? present.map((s, j) => (j === edit.index ? t : s)) : present.filter((_, j) => j !== edit.index);
    else if (t) shapes = [...present, t];
    if (edit) commitEdit();
    setSelected(null);
    setSaving(true);
    setError(null);
    try {
      // Nothing drawn: the original goes as it is, with its own name.
      if (!shapes.length) return onDone({ action: "original" });
      onDone({ action: "use", file: await exportImage(img, shapes, file.name) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image couldn't be saved.");
      setSaving(false);
    }
  }

  // ── Keyboard (see shortcuts.ts) ──
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const k = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl) {
      const lower = k.toLowerCase();
      if (lower === "z") changeHistory(e.shiftKey ? redo : undo);
      else if (lower === "y") changeHistory(redo);
      else if (k === "Enter") void saveImage();
      else if (k === "=" || k === "+") zoomTo(scale * ZOOM_STEP);
      else if (k === "-" || k === "_") zoomTo(scale / ZOOM_STEP);
      else if (k === "0") zoomTo(fit);
      else return;
      e.preventDefault();
      return;
    }
    if (e.altKey) return;
    if (k === " ") {
      e.preventDefault();
      setSpaceHeld(true);
      return;
    }
    if (k === "?") return setHelp((h) => !h);
    const sel = selected !== null ? present[selected] : undefined;
    if ((k === "Delete" || k === "Backspace") && sel) {
      e.preventDefault();
      removeAt(selected!);
      setSelected(null);
      return;
    }
    if (k.startsWith("Arrow") && sel) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = k === "ArrowLeft" ? -step : k === "ArrowRight" ? step : 0;
      const dy = k === "ArrowUp" ? -step : k === "ArrowDown" ? step : 0;
      replaceAt(selected!, move(sel, dx, dy));
      return;
    }
    if (k === "[" || k === "]") return bumpSize(k === "]" ? 1 : -1);
    if (/^[1-4]$/.test(k)) return pickColor(MARK_COLORS[Number(k) - 1].value);
    const t = toolForKey(k);
    if (t) {
      e.preventDefault();
      pickTool(t);
    }
  }

  const open = file !== null;
  const busy = !!draft || !!edit || !!live;

  /** Leaving never uploads an unmarked copy: an edited image stays as it was, a new one isn't added. */
  const leave = () => onDone(isEdit ? { action: "original" } : { action: "remove" });
  /** The corner X asks first when something would be lost: a new image, or marks drawn on this one. */
  const askLeave = () => (!isEdit || present.length || busy ? setLeavingFor(file) : leave());
  const sel = selected !== null ? present[selected] : undefined;
  const textFor = edit ? edit.fontPx : hasText(sel) ? fontOf(sel, W) : null;
  const sizeShown = textFor === null ? textSize : (TEXT_SIZES.find((s) => textFontSize(W, s.id) === textFor)?.id ?? null);
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        // Esc first cancels what is being drawn or typed, then the selection; Esc and a click outside never throw the
        // markup away.
        if (details.reason === "escape-key" || details.reason === "outside-press") {
          if (busy) {
            setDraft(null);
            setLive(null);
            setEdit(null);
            setText("");
            drag.current = null;
          } else setSelected(null);
          details.cancel();
          return;
        }
        onDone({ action: "remove" });
      }}
    >
      {open ? (
        // Our own corner X (not the dialog's), so leaving asks first instead of silently dropping the image.
        <DialogContent
          className="sm:max-w-6xl max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:max-w-none max-md:flex-col max-md:gap-2 max-md:overflow-hidden max-md:rounded-none max-md:px-3 max-md:pt-[calc(0.75rem+env(safe-area-inset-top))] max-md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-md:short:grid max-md:short:grid-cols-[minmax(0,1fr)_17rem] max-md:short:grid-rows-[auto_minmax(0,1fr)_auto_auto]"
          showGrabber={false}
          showCloseButton={false}
          onKeyDown={onKeyDown} onKeyUp={(e) => e.key === " " && setSpaceHeld(false)}>
          <button
            type="button"
            onClick={askLeave}
            disabled={saving}
            aria-label="Leave without saving"
            title="Leave without saving"
            className="absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-surface3 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 max-md:top-[calc(0.5rem+env(safe-area-inset-top))] max-md:right-2"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
          <DialogHeader className="pr-10 max-md:shrink-0 max-md:short:col-start-2">
            <DialogTitle className="truncate max-md:text-[1.0625rem]" title={file.name}>
              {file.name}
            </DialogTitle>
            <DialogDescription className="max-md:text-[0.8125rem] max-md:short:hidden">
              {position && position.total > 1 ? `${position.index} of ${position.total} · ` : ""}
              <span className="max-md:hidden">Mark up this screenshot: point at the problem, and hide names, account numbers and amounts before it uploads.</span>
              <span className="md:hidden">Hide names, account numbers and amounts.</span>
            </DialogDescription>
          </DialogHeader>

          <MarkupToolbar
            className="max-md:order-2 max-md:shrink-0 max-md:short:col-start-2 max-md:short:row-start-2 max-md:short:content-start max-md:short:overflow-y-auto"
            tool={tool}
            onTool={pickTool}
            color={edit?.color ?? (sel && "color" in sel ? sel.color : color)}
            onColor={pickColor}
            showSize={tool === "text" || tool === "step" || tool === "callout" || !!edit || hasText(sel)}
            textSize={sizeShown}
            onTextSize={pickSize}
            canUndo={canUndo(history)}
            canRedo={canRedo(history)}
            onUndo={() => changeHistory(undo)}
            onRedo={() => changeHistory(redo)}
            canClear={!!present.length}
            onClear={() => changeHistory((h) => push(h, []))}
            zoomPercent={Math.round(scale * 100)}
            canZoomIn={!!img && clampZoom(scale * ZOOM_STEP, fit, W, dpr) > scale + 1e-4}
            canZoomOut={scale > fit + 1e-4}
            onZoomIn={() => zoomTo(scale * ZOOM_STEP)}
            onZoomOut={() => zoomTo(scale / ZOOM_STEP)}
            onFit={() => zoomTo(fit)}
            help={help}
            onHelp={() => setHelp((h) => !h)}
          />

          <div
            ref={stage}
            className="relative flex touch-none overflow-auto rounded-lg border border-line bg-black max-md:order-1 max-md:min-h-0 max-md:flex-1 max-md:short:col-start-1 max-md:short:row-span-4 max-md:short:row-start-1"
            style={mobile ? undefined : { height: stageH }}
            onPointerDownCapture={onFingerDown}
            onPointerMoveCapture={onFingerMove}
            onPointerUpCapture={onFingerUp}
            onPointerCancelCapture={onFingerUp}
          >
            {img && scale ? (
              <div className="relative m-auto shrink-0" style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale }}>
                <canvas
                  ref={canvas}
                  aria-label="Screenshot being marked up"
                  className={cn(
                    "block touch-none",
                    spaceHeld ? "cursor-grab active:cursor-grabbing" : tool === "select" ? "cursor-default" : tool === "text" ? "cursor-text" : "cursor-crosshair",
                  )}
                  style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onDoubleClick={onDoubleClick}
                  // The click that places a text box would otherwise move focus to the dialog right after the box opens.
                  onMouseDown={(e) => (tool === "text" || tool === "callout") && e.preventDefault()}
                />
                {edit ? <TextBox edit={edit} text={text} onText={setText} scale={scale} inputRef={textInput} onCommit={commitEdit} /> : null}
              </div>
            ) : (
              <p role={error ? "alert" : "status"} className="m-auto p-6 text-sm text-white/70">
                {error ?? "Opening the image…"}
              </p>
            )}
          </div>

          {error && img ? (
            <p role="alert" className="text-[0.7813rem] font-medium text-destructive-text max-md:order-3 max-md:shrink-0 max-md:short:col-start-2 max-md:short:row-start-3">
              {error}
            </p>
          ) : null}

          {leaving ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn-b bg-warn-t px-3.5 py-2.5 text-sm text-foreground max-md:order-3 max-md:shrink-0 max-md:short:col-start-2 max-md:short:row-start-3">
              <span className="min-w-0 flex-1">
                {isEdit ? "Leave? Your new marks won't be saved, and the image stays as it was." : "Leave? This screenshot won't be added."}
              </span>
              <span className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setLeavingFor(null)} autoFocus>
                  Keep editing
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={leave}>
                  Leave
                </Button>
              </span>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-between max-md:order-4 max-md:mx-0 max-md:mb-0 max-md:shrink-0 max-md:flex-row max-md:flex-wrap max-md:items-center max-md:justify-between max-md:border-t-0 max-md:p-0 max-md:pt-1 max-md:short:col-start-2 max-md:short:row-start-4">
            <Button type="button" variant="outline" onClick={() => onDone({ action: "remove" })} disabled={saving} className="hover:bg-bad-t hover:text-bad">
              Remove
            </Button>
            <div className="flex gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onDone({ action: "original" })} disabled={saving}>
                Use original
              </Button>
              <Button type="button" onClick={saveImage} disabled={saving || !img} title="Use image (Ctrl+Enter)">
                {saving ? "Saving…" : "Use image"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

/**
 * The box you type a note or callout into, sitting exactly where it will be drawn, in its colour and size. It's placed
 * on Enter, a click elsewhere, another tool or Use image, never on blur: the dialog moves focus around on clicks.
 */
function TextBox({ edit, text, onText, scale, inputRef, onCommit }: { edit: TextEdit; text: string; onText: (t: string) => void; scale: number; inputRef: React.RefObject<HTMLInputElement | null>; onCommit: () => void }) {
  const px = edit.fontPx * scale;
  const callout = edit.kind === "callout";
  const pad = callout ? edit.fontPx * 0.45 * scale : 0;
  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => onText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        }
      }}
      aria-label={callout ? "Callout text" : "Text to add"}
      placeholder="Type, then Enter"
      maxLength={200}
      className={cn("absolute rounded-sm border border-dashed border-acc font-semibold outline-none placeholder:font-normal", callout ? "placeholder:text-white/80" : "bg-black/25 placeholder:text-white/70")}
      style={{
        left: edit.at.x * scale,
        top: edit.at.y * scale - 1,
        padding: pad,
        font: FONT(Math.max(16, px)),
        lineHeight: LINE,
        color: callout ? ON_MARK : edit.color,
        backgroundColor: callout ? edit.color : undefined,
        width: `${Math.max(text.length, 14) + 1}ch`,
        textShadow: callout ? undefined : `0 0 2px ${TEXT_OUTLINE}, 0 0 2px ${TEXT_OUTLINE}`,
      }}
    />
  );
}
