// Corn cobs: the sweetener of the run. Spawned in little arcs that trace the shape of a jump (so
// the reward for a good leap is a string of cobs), collected by touch, worth CORN_SCORE each.

import { CORN_SCORE, GROUND_Y, PAINT, VIEW_W } from './config.js';
import { chunkyEllipse, ellipsePath, setChunkyStyle } from './art.js';

export class CornField {
  constructor() {
    this.reset(null);
  }

  reset(rng) {
    this.cobs = [];
    this.rng = rng;
    this.nextArcX = 520;
  }

  /** Drop an arc of 3-5 cobs every so often, ahead of the hazards on the same scroll. */
  schedule(scrollX) {
    if (scrollX < this.nextArcX) return;
    this.nextArcX = scrollX + (this.rng ? this.rng.range(700, 1300) : 950);
    const n = this.rng ? this.rng.int(3, 5) : 4;
    const baseY = GROUND_Y - (this.rng ? this.rng.range(60, 150) : 110);
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      this.cobs.push({
        x: VIEW_W + 120 + i * 74,
        y: baseY - Math.sin(t * Math.PI) * 60,
        bobPhase: this.rng ? this.rng.range(0, 6.28) : i,
        eaten: false,
      });
    }
  }

  /** Scroll, bob, and eat-test. Returns cobs eaten this step (caller adds score and plays a blip). */
  update(dt, scrollSpeed, turkeyBox, timeSecs) {
    this.schedule(this.scrollTotal(dt, scrollSpeed));
    let eaten = 0;
    for (let i = this.cobs.length - 1; i >= 0; i -= 1) {
      const c = this.cobs[i];
      c.x -= scrollSpeed * dt;
      if (c.x < -60) {
        this.cobs.splice(i, 1);
        continue;
      }
      const cy = c.y + Math.sin(timeSecs * 3 + c.bobPhase) * 5;
      if (!c.eaten && turkeyBox.x1 > c.x - 20 && turkeyBox.x0 < c.x + 20 && turkeyBox.y1 > cy - 22 && turkeyBox.y0 < cy + 22) {
        c.eaten = true;
        eaten += 1;
        this.cobs.splice(i, 1);
      }
    }
    return eaten;
  }

  scrollTotal(dt, scrollSpeed) {
    this._scroll = (this._scroll ?? 0) + scrollSpeed * dt;
    return this._scroll;
  }

  draw(ctx, timeSecs) {
    for (const c of this.cobs) {
      const cy = c.y + Math.sin(timeSecs * 3 + c.bobPhase) * 5;
      const glow = ctx.createRadialGradient(c.x, cy, 2, c.x, cy, 24);
      glow.addColorStop(0, 'rgba(255,201,60,0.2)');
      glow.addColorStop(1, 'rgba(255,201,60,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(c.x - 26, cy - 26, 52, 52);
      ctx.save();
      ctx.translate(c.x, cy);
      ctx.rotate(-0.35);
      // husk leaves
      setChunkyStyle(ctx, PAINT.cornHusk);
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(-16, 22, -10, 34);
      ctx.quadraticCurveTo(-2, 26, 0, 20);
      ctx.quadraticCurveTo(2, 26, 10, 34);
      ctx.quadraticCurveTo(16, 22, 0, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // cob
      setChunkyStyle(ctx, PAINT.corn);
      ellipsePath(ctx, 0, 0, 11, 20);
      ctx.fill();
      ctx.stroke();
      // kernel rows
      ctx.fillStyle = 'rgba(200,120,20,0.5)';
      for (let r = -2; r <= 2; r += 1) {
        for (let k = -1; k <= 1; k += 1) {
          ctx.beginPath();
          ctx.arc(k * 6, r * 7, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }
}

export { CORN_SCORE };
