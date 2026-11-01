import { HIDE_COLOR, HIGHLIGHT, ON_MARK, SELECT_HANDLE, SELECT_LINE, TEXT_OUTLINE } from "./colors";
import { bounds, calloutBox, handlesOf, LINE, stepRadius, type Measure } from "./geometry";
import { arrowHead, fontOf, strokeFor, type Point, type Shape } from "./shapes";

// Painting marks on a canvas, at image scale. Used by the editor (on screen) and by the export (full size), so what
// the tester sees is what gets uploaded.

export const FONT = (px: number) => `600 ${px}px system-ui, sans-serif`;

/** Text width from the canvas itself, for frames and callout boxes. */
export function canvasMeasure(ctx: CanvasRenderingContext2D): Measure {
  return (text, fontPx) => {
    ctx.save();
    ctx.font = FONT(fontPx);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  };
}

function arrowLine(ctx: CanvasRenderingContext2D, from: Point, to: Point, sw: number) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  const [a, b] = arrowHead(from, to, sw * 5);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.closePath();
  ctx.fill();
}

/** Draws one mark. `imageWidth` sizes lines and text, so marks look alike on a laptop screenshot and a 4K one. */
export function drawShape(ctx: CanvasRenderingContext2D, s: Shape, imageWidth: number, measure: Measure = canvasMeasure(ctx)) {
  const sw = strokeFor(imageWidth);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = sw;
  switch (s.kind) {
    case "box":
      ctx.strokeStyle = s.color;
      ctx.strokeRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      break;
    case "ellipse":
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(s.rect.x + s.rect.w / 2, s.rect.y + s.rect.h / 2, s.rect.w / 2, s.rect.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "arrow":
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      arrowLine(ctx, s.from, s.to, sw);
      break;
    case "pen":
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      break;
    case "highlight":
      ctx.fillStyle = HIGHLIGHT;
      ctx.fillRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      break;
    case "text": {
      const fs = fontOf(s, imageWidth);
      ctx.font = FONT(fs);
      ctx.textBaseline = "top";
      // A white outline keeps the note readable on any background.
      ctx.lineWidth = Math.max(3, fs / 5);
      ctx.strokeStyle = TEXT_OUTLINE;
      ctx.strokeText(s.text, s.at.x, s.at.y);
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.at.x, s.at.y);
      break;
    }
    case "step": {
      const fs = fontOf(s, imageWidth);
      const r = stepRadius(fs);
      ctx.beginPath();
      ctx.arc(s.at.x, s.at.y, r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.lineWidth = Math.max(2, r / 8);
      ctx.strokeStyle = TEXT_OUTLINE;
      ctx.stroke();
      ctx.font = FONT(fs);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = ON_MARK;
      ctx.fillText(String(s.n), s.at.x, s.at.y + fs * 0.05);
      break;
    }
    case "callout": {
      const fs = fontOf(s, imageWidth);
      const box = calloutBox(s, imageWidth, measure);
      const centre = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      arrowLine(ctx, centre, s.tip, sw);
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, fs * 0.3);
      ctx.fill();
      ctx.lineWidth = Math.max(2, sw / 2);
      ctx.strokeStyle = TEXT_OUTLINE;
      ctx.stroke();
      ctx.font = FONT(fs);
      ctx.textBaseline = "top";
      ctx.fillStyle = ON_MARK;
      ctx.fillText(s.text, box.x + fs * 0.45, box.y + fs * 0.45 + (fs * (LINE - 1)) / 2);
      break;
    }
    case "hide":
      ctx.fillStyle = HIDE_COLOR;
      ctx.fillRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      break;
    case "crop":
      break;
  }
  ctx.restore();
}

/** Editor only: a dashed frame and drag handles around the selected mark. `scale` keeps them the same size on screen. */
export function drawSelection(ctx: CanvasRenderingContext2D, s: Shape, imageWidth: number, scale: number, measure: Measure = canvasMeasure(ctx)) {
  const px = 1 / scale;
  const b = bounds(s, imageWidth, measure);
  const pad = 4 * px;
  ctx.save();
  ctx.setLineDash([5 * px, 4 * px]);
  ctx.lineWidth = 1.5 * px;
  ctx.strokeStyle = SELECT_LINE;
  ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
  ctx.setLineDash([]);
  for (const h of handlesOf(s, imageWidth, measure)) {
    ctx.beginPath();
    ctx.arc(h.at.x, h.at.y, 6 * px, 0, Math.PI * 2);
    ctx.fillStyle = SELECT_HANDLE;
    ctx.fill();
    ctx.lineWidth = 2 * px;
    ctx.strokeStyle = SELECT_LINE;
    ctx.stroke();
  }
  ctx.restore();
}
