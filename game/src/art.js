// Shared canvas-drawing vocabulary the art modules build on: chunky outlined shapes, gradients,
// stroked text and a few primitives (rounded boxes, hearts, stars, feather vanes). Nothing knows
// about the game here; it is purely "draw this shape in the house style".

import { PAINT } from './config.js';

/** Stroke width of the house outline. */
export const OUTLINE = 4;

export function setChunkyStyle(ctx, fill, stroke = PAINT.ink, width = OUTLINE) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

export function fillAndStroke(ctx) {
  ctx.fill();
  ctx.stroke();
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function chunkyRoundRect(ctx, x, y, w, h, r, fill) {
  setChunkyStyle(ctx, fill);
  roundRectPath(ctx, x, y, w, h, r);
  fillAndStroke(ctx);
}

export function ellipsePath(ctx, cx, cy, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
}

export function chunkyEllipse(ctx, cx, cy, rx, ry, fill, rotation = 0) {
  setChunkyStyle(ctx, fill);
  ellipsePath(ctx, cx, cy, rx, ry, rotation);
  fillAndStroke(ctx);
}

/** Classic heart centred at (cx, cy), sized by s (s = half-height roughly). */
export function chunkyHeart(ctx, cx, cy, s, fill) {
  setChunkyStyle(ctx, fill);
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy - s * 0.15, cx - s * 0.75, cy - s * 1.05, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.75, cy - s * 1.05, cx + s * 1.4, cy - s * 0.15, cx, cy + s * 0.9);
  ctx.closePath();
  fillAndStroke(ctx);
}

/** Five-pointed star at (cx, cy). */
export function chunkyStar(ctx, cx, cy, r, fill, rotation = 0) {
  setChunkyStyle(ctx, fill);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = rotation + (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  fillAndStroke(ctx);
}

/**
 * One turkey feather vane: a pointed oval shaft with a rounded tip, drawn from (x, y) pointing
 * along angle `a`, length len. `tip` colours the broad end, `base` the quill end.
 */
export function featherVane(ctx, x, y, a, len, base, tip) {
  const grad = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
  grad.addColorStop(0, base);
  grad.addColorStop(1, tip);
  setChunkyStyle(ctx, grad);
  const nx = Math.cos(a + Math.PI / 2);
  const ny = Math.sin(a + Math.PI / 2);
  const w = len * 0.24;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + nx * w, y + Math.sin(a) * len * 0.5 + ny * w, x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 - nx * w, y + Math.sin(a) * len * 0.5 - ny * w, x, y);
  ctx.closePath();
  fillAndStroke(ctx);
  // shaft line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(42,20,8,0.35)';
  ctx.lineWidth = 2;
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(a) * len * 0.92, y + Math.sin(a) * len * 0.92);
  ctx.stroke();
}

const FONT_STACK = '"Trebuchet MS", Verdana, DejaVu Sans, sans-serif';

/** Big display text: cream fill, ink outline, soft drop shadow — readable when shrunk small. */
export function displayText(ctx, text, cx, cy, size, fill = PAINT.cream, align = 'center') {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,8,2,0.45)';
  ctx.fillText(text, cx + size * 0.045, cy + size * 0.06);
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = Math.max(4, size * 0.11);
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

/** Smaller caption text with a thin outline. */
export function captionText(ctx, text, cx, cy, size, fill = PAINT.butter, align = 'center') {
  ctx.save();
  ctx.font = `600 ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(42,20,8,0.85)';
  ctx.lineWidth = Math.max(3, size * 0.14);
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

/** Linear gradient helper: stops is [[offset, colour], ...]. */
export function verticalGradient(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
