// Juice in particle form: feather bursts when the turkey is hit, dust puffs at its feet and on
// landing, sparkles when corn is eaten, confetti on the escape. One flat list, one update, one
// draw; emitters push ready-made particle records. Particles never talk to game logic.

import { GROUND_Y, PAINT } from './config.js';
import { featherVane, setChunkyStyle } from './art.js';

export class ParticleSky {
  constructor() {
    this.list = [];
  }

  reset() {
    this.list = [];
  }

  emitFeathers(x, y, n, rng) {
    for (let i = 0; i < n; i += 1) {
      const a = rng.range(-Math.PI, 0);
      this.list.push({
        type: 'feather',
        x, y,
        vx: Math.cos(a) * rng.range(60, 240) + 60,
        vy: Math.sin(a) * rng.range(120, 330),
        rot: rng.range(0, 6.28),
        spin: rng.range(-6, 6),
        len: rng.range(16, 26),
        hue: rng.call() < 0.5 ? PAINT.turkeyDark : PAINT.butter,
        life: rng.range(0.9, 1.6),
        age: 0,
        grav: 260,
      });
    }
  }

  emitDust(x, y, n, rng) {
    for (let i = 0; i < n; i += 1) {
      this.list.push({
        type: 'dust',
        x: x + rng.range(-8, 8), y,
        vx: rng.range(-140, -40),
        vy: rng.range(-90, -20),
        rot: 0, spin: 0, len: rng.range(4, 9),
        hue: '#a98a5f',
        life: rng.range(0.35, 0.7),
        age: 0,
        grav: 140,
      });
    }
  }

  emitSparkles(x, y, n, rng) {
    for (let i = 0; i < n; i += 1) {
      const a = rng.range(0, 6.28);
      this.list.push({
        type: 'spark',
        x, y,
        vx: Math.cos(a) * rng.range(40, 180),
        vy: Math.sin(a) * rng.range(40, 180) - 60,
        rot: a, spin: 4, len: rng.range(5, 10),
        hue: PAINT.corn,
        life: rng.range(0.3, 0.6),
        age: 0,
        grav: 60,
      });
    }
  }

  emitConfetti(n, rng) {
    for (let i = 0; i < n; i += 1) {
      this.list.push({
        type: 'confetti',
        x: rng.range(0, 1280), y: rng.range(-200, 80),
        vx: rng.range(-40, 40),
        vy: rng.range(60, 160),
        rot: rng.range(0, 6.28), spin: rng.range(-8, 8),
        len: rng.range(6, 12),
        hue: rng.pick([PAINT.corn, PAINT.wattle, PAINT.cream, '#7fb069', PAINT.fire]),
        life: rng.range(2.5, 4.5),
        age: 0,
        grav: 30,
      });
    }
  }

  update(dt, scrollSpeed) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.x += (p.vx - (p.type === 'dust' ? scrollSpeed * 0.4 : 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.type === 'feather') p.vx += Math.sin(p.age * 9 + p.rot) * 30 * dt; // feathers flutter
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      const fade = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      if (p.type === 'feather') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        featherVane(ctx, 0, 0, 0, p.len, p.hue, PAINT.cream);
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.hue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.len * fade, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        setChunkyStyle(ctx, p.hue, p.hue, 1);
        ctx.fillRect(-p.len / 2, -1.5, p.len, 3);
        ctx.fillRect(-1.5, -p.len / 2, 3, p.len);
      } else {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.hue;
        ctx.fillRect(-p.len / 2, -p.len / 4, p.len, p.len / 2);
      }
      ctx.restore();
    }
  }
}

export const DUST_SCROLL_HINT_GROUND = GROUND_Y;
