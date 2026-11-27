// The three ways Thanksgiving tries to end the turkey, plus the thrower's knives. Owns spawning
// (a distance-driven schedule that tightens with the yard count and changes recipe per zone),
// motion, collision boxes and drawing of: hay bales to jump, hanging carving knives to duck, oven
// ranges to hurdle, and thrown knives that sail in off the farmer's side.

import { GROUND_Y, PAINT, VIEW_W, ZONE_BARN, ZONE_FARM, ZONE_KITCHEN, zoneAtYards } from './config.js';
import { chunkyRoundRect, ellipsePath, setChunkyStyle, verticalGradient } from './art.js';

export const KIND_BALE = 'bale'; // ground: jump
export const KIND_HUNG = 'hung'; // ceiling-hung knife: duck
export const KIND_OVEN = 'oven'; // ground: jump (wide, needs timing)
export const KIND_THROWN = 'thrown'; // knife in flight: jump or duck by its height

const THROWN_LOW_Y = GROUND_Y - 40; // chest-low: hop over
const THROWN_HIGH_Y = GROUND_Y - 84; // neck-high: duck under
const HUNG_CLEARANCE = 70; // gap left under a hung knife's tip — only a duck fits

/** One carving knife body: steel blade with a wooden handle, drawn along +x from the origin. */
export function drawCarvingKnife(ctx, len) {
  const bladeLen = len * 0.62;
  const g = verticalGradient(ctx, -9, 9, [
    [0, '#eef3f8'],
    [0.55, PAINT.steel],
    [1, '#93a3b5'],
  ]);
  setChunkyStyle(ctx, g, PAINT.ink, 3.5);
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(bladeLen - 6, -9);
  ctx.quadraticCurveTo(bladeLen + 8, -2, bladeLen - 2, 6);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // edge glint
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(bladeLen - 10, -5);
  ctx.stroke();
  // handle
  setChunkyStyle(ctx, '#5b3418');
  ctx.beginPath();
  ctx.moveTo(-2, -7);
  ctx.lineTo(-len * 0.38, -6);
  ctx.quadraticCurveTo(-len * 0.44, 0, -len * 0.38, 6);
  ctx.lineTo(-2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.butter;
  for (const rx of [-len * 0.12, -len * 0.28]) {
    ctx.beginPath();
    ctx.arc(rx, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class HazardField {
  constructor() {
    this.items = [];
    this.rng = null;
    this.nextSpawnYards = 0;
  }

  reset(rng) {
    this.items = [];
    this.rng = rng;
    this.nextSpawnYards = 40; // a calm opening stretch
  }

  /** Place one hazard of `kind` at screen x (screenshot staging and normal spawns share this). */
  spawn(kind, x, opts = {}) {
    const item = { kind, x, spin: 0 };
    if (kind === KIND_BALE) {
      item.w = opts.tall ? 84 : 76;
      item.h = opts.tall ? 96 : 58;
      item.y = GROUND_Y - item.h;
    } else if (kind === KIND_HUNG) {
      item.w = 46;
      item.h = 96;
      item.y = GROUND_Y - HUNG_CLEARANCE; // the blade's lowest point; duck under it
      item.swayPhase = this.rng ? this.rng.range(0, 6.28) : 0;
    } else if (kind === KIND_OVEN) {
      item.w = 118;
      item.h = 78;
      item.y = GROUND_Y - item.h;
    } else if (kind === KIND_THROWN) {
      item.w = 64;
      item.h = 20;
      item.y = opts.high ? THROWN_HIGH_Y : THROWN_LOW_Y;
      item.vx = opts.vx ?? 330;
      item.wobble = this.rng ? this.rng.range(0, 6.28) : 0;
    }
    this.items.push(item);
    return item;
  }

  /** Distance-gated spawner: tighter gaps and nastier recipes the deeper the run gets. */
  schedule(yards) {
    if (yards < this.nextSpawnYards) return;
    const rng = this.rng;
    const zone = zoneAtYards(yards);
    const heat = Math.min(1, yards / 1400);
    const gap = 58 - heat * 26 + (rng ? rng.range(0, 12) : 6);
    this.nextSpawnYards = yards + gap;
    const x = VIEW_W + 90;
    if (zone === ZONE_FARM) {
      const roll = rng ? rng.call() : 0.5;
      if (roll < 0.45) this.spawn(KIND_BALE, x, { tall: heat > 0.18 && rng.call() < heat * 0.6 });
      else if (roll < 0.75) this.spawn(KIND_THROWN, -60, { high: rng.call() < 0.5 });
      else this.spawn(KIND_BALE, x);
    } else if (zone === ZONE_BARN) {
      const roll = rng ? rng.call() : 0.5;
      if (roll < 0.3) this.spawn(KIND_BALE, x, { tall: heat > 0.3 && rng.call() < 0.3 + heat * 0.3 });
      else if (roll < 0.6) this.spawn(KIND_HUNG, x);
      else this.spawn(KIND_THROWN, -60, { high: rng.call() < 0.55 });
    } else {
      const roll = rng ? rng.call() : 0.5;
      if (roll < 0.4) this.spawn(KIND_OVEN, x);
      else if (roll < 0.7) this.spawn(KIND_HUNG, x);
      else this.spawn(KIND_THROWN, -60, { high: rng.call() < 0.5 });
    }
  }

  /**
   * Move everything one step and test the turkey's box. Returns the kind of the first hazard hit
   * (or null); hit hazards are removed so one bump costs exactly one heart.
   */
  update(dt, scrollSpeed, yards, turkeyBox, timeSecs) {
    this.schedule(yards);
    let hitKind = null;
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const it = this.items[i];
      if (it.kind === KIND_THROWN) {
        it.x += it.vx * dt;
        it.spin += dt * 13;
        it.wobble += dt * 6;
        if (it.x > VIEW_W + 140) {
          this.items.splice(i, 1);
          continue;
        }
      } else {
        it.x -= scrollSpeed * dt;
        if (it.x + (it.w ?? 60) < -80) {
          this.items.splice(i, 1);
          continue;
        }
      }
      const box = this.boxOf(it, timeSecs);
      if (!hitKind && turkeyBox.x1 > box.x0 && turkeyBox.x0 < box.x1 && turkeyBox.y1 > box.y0 && turkeyBox.y0 < box.y1) {
        hitKind = it.kind;
        this.items.splice(i, 1);
      }
    }
    return hitKind;
  }

  /** Current collision rect of an item (hanging knives sway, so it moves). */
  boxOf(it, timeSecs) {
    if (it.kind === KIND_THROWN) {
      const wob = Math.sin(it.wobble) * 5;
      return { x0: it.x - it.w / 2 + 8, x1: it.x + it.w / 2 - 8, y0: it.y + wob - it.h / 2 + 3, y1: it.y + wob + it.h / 2 - 3 };
    }
    if (it.kind === KIND_HUNG) {
      const sway = Math.sin(timeSecs * 2 + it.swayPhase) * 6;
      return { x0: it.x + sway - 16, x1: it.x + sway + 16, y0: 0, y1: it.y };
    }
    return { x0: it.x, x1: it.x + it.w, y0: it.y, y1: it.y + it.h };
  }

  draw(ctx, timeSecs) {
    for (const it of this.items) {
      if (it.kind === KIND_BALE) drawBale(ctx, it);
      else if (it.kind === KIND_HUNG) drawHungKnife(ctx, it, timeSecs);
      else if (it.kind === KIND_OVEN) drawOven(ctx, it, timeSecs);
      else if (it.kind === KIND_THROWN) drawThrownKnife(ctx, it);
    }
  }
}

function drawBale(ctx, it) {
  chunkyRoundRect(ctx, it.x, it.y, it.w, it.h, 10, PAINT.hay);
  ctx.strokeStyle = 'rgba(42,20,8,0.35)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(it.x + 6, it.y + (it.h * i) / 4);
    ctx.lineTo(it.x + it.w - 6, it.y + (it.h * i) / 4 - 3);
    ctx.stroke();
  }
  // twine bands
  ctx.strokeStyle = '#7a4c22';
  ctx.lineWidth = 4;
  for (const fx of [0.3, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(it.x + it.w * fx, it.y - 2);
    ctx.lineTo(it.x + it.w * fx, it.y + it.h + 2);
    ctx.stroke();
  }
  // stray straw
  ctx.strokeStyle = PAINT.butter;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const sx = it.x + ((i * 37) % it.w);
    ctx.beginPath();
    ctx.moveTo(sx, it.y + 4);
    ctx.lineTo(sx + ((i % 2 ? 1 : -1) * 9), it.y - 7);
    ctx.stroke();
  }
}

function drawHungKnife(ctx, it, timeSecs) {
  const sway = Math.sin(timeSecs * 2 + it.swayPhase) * 6;
  const cx = it.x + sway;
  const TIP_FROM_ORIGIN = 65; // how far the blade tip sits along the knife's local +x
  const handleTop = it.y - TIP_FROM_ORIGIN - 40;
  // rafter the rope hangs from, so the wire is anchored, not infinite
  ctx.fillStyle = '#4a2c1a';
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(it.x - 52, 0, 104, 16);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#4a3a28';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(it.x, 12);
  ctx.quadraticCurveTo(it.x + sway * 0.5, (12 + handleTop) / 2, cx, handleTop);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, it.y - TIP_FROM_ORIGIN);
  ctx.rotate(Math.PI / 2 + sway * 0.008); // blade down, tip at it.y
  drawCarvingKnife(ctx, 92);
  ctx.restore();
  // danger glint at the tip
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(cx + 2, it.y - 2, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawOven(ctx, it, timeSecs) {
  const x = it.x;
  const y = it.y;
  const w = it.w;
  const h = it.h;
  // legs
  ctx.fillStyle = '#3a3f46';
  ctx.fillRect(x + 8, y + h, 8, 8);
  ctx.fillRect(x + w - 16, y + h, 8, 8);
  // steel body
  const g = verticalGradient(ctx, y, y + h, [
    [0, '#aab4bf'],
    [0.5, '#7c8794'],
    [1, '#59626d'],
  ]);
  chunkyRoundRect(ctx, x, y, w, h, 8, g);
  // glowing door
  const flicker = 0.75 + 0.25 * Math.sin(timeSecs * 9 + x);
  const fg = ctx.createRadialGradient(x + w / 2, y + h * 0.55, 4, x + w / 2, y + h * 0.55, w * 0.55);
  fg.addColorStop(0, `rgba(255,214,120,${flicker})`);
  fg.addColorStop(0.55, `rgba(255,122,47,${flicker * 0.9})`);
  fg.addColorStop(1, 'rgba(140,30,10,0.95)');
  chunkyRoundRect(ctx, x + 10, y + 16, w - 20, h - 26, 6, fg);
  // door handle
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 12);
  ctx.lineTo(x + w - 12, y + 12);
  ctx.stroke();
  // heat shimmer above
  ctx.strokeStyle = `rgba(255,150,70,${0.35 * flicker})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const hx = x + w * (0.25 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(hx, y - 6);
    ctx.quadraticCurveTo(hx + 5, y - 16 - Math.sin(timeSecs * 6 + i) * 4, hx, y - 26);
    ctx.stroke();
  }
}

function drawThrownKnife(ctx, it) {
  const wob = Math.sin(it.wobble) * 5;
  ctx.save();
  ctx.translate(it.x, it.y + wob);
  ctx.rotate(it.spin);
  drawCarvingKnife(ctx, 64);
  ctx.restore();
  // motion streak
  ctx.strokeStyle = 'rgba(255,237,207,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(it.x - 46, it.y + wob + 6);
  ctx.lineTo(it.x - 14, it.y + wob + 2);
  ctx.stroke();
}
