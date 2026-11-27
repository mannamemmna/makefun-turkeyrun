// The star of the escape: the turkey. Owns its physics (run in place, strafe, jump, duck, fast
// fall), its animation clock and its whole procedural drawing — tail fan, body, flapping wing,
// S-neck, wattle and running legs. The world only asks for update(dt, command) and draw(ctx).

import {
  FAST_FALL_VELOCITY, GRAVITY, GROUND_Y, HIT_INVULN_SECONDS, JUMP_VELOCITY, PAINT, STRAFE_SPEED, STRAFE_X_MAX, STRAFE_X_MIN,
} from './config.js';
import { chunkyEllipse, ellipsePath, featherVane, setChunkyStyle } from './art.js';

/** Standing height of the turkey's collision box; ducking flattens it to DUCK_HEIGHT. */
export const STAND_HEIGHT = 104;
export const DUCK_HEIGHT = 58;
const HALF_WIDTH = 30;

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 330;
    this.y = GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.duck = 0; // eased 0..1 crouch amount
    this.animT = 0; // leg/wing clock
    this.flapT = 0; // wing flap clock while airborne
    this.invulnT = 0;
    this.scareT = 0; // wide-eyed for a moment after a hit
    this.landPuff = 0; // squash timer after touching down
  }

  /** Advance one fixed step. `command` is {slide, duck, jump}; returns event bits (JUMPED, LANDED). */
  update(dt, command) {
    let events = 0;
    this.x = Math.min(STRAFE_X_MAX, Math.max(STRAFE_X_MIN, this.x + command.slide * STRAFE_SPEED * dt));

    if (command.jump && this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      events |= TURKEY_JUMPED;
    }
    const wantDuck = command.duck ? 1 : 0;
    this.duck += (wantDuck - this.duck) * Math.min(1, dt * 14);
    if (!this.onGround && command.duck) this.vy += FAST_FALL_VELOCITY * dt * 2.2;

    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      this.flapT += dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        this.landPuff = 0.18;
        events |= TURKEY_LANDED;
      }
    }
    this.animT += dt;
    this.scareT = Math.max(0, this.scareT - dt);
    this.landPuff = Math.max(0, this.landPuff - dt);
    if (this.invulnT > 0) this.invulnT -= dt;
    return events;
  }

  /** Take a hit: returns true if it landed (not shielded by invulnerability). */
  hit() {
    if (this.invulnT > 0) return false;
    this.invulnT = HIT_INVULN_SECONDS;
    this.scareT = 1.1;
    return true;
  }

  get height() {
    return STAND_HEIGHT - (STAND_HEIGHT - DUCK_HEIGHT) * this.duck;
  }

  /** Axis-aligned box in screen space the hazards test against. */
  collisionBox() {
    return { x0: this.x - HALF_WIDTH + 6, x1: this.x + HALF_WIDTH - 6, y0: this.y - this.height + 8, y1: this.y };
  }
}

export const TURKEY_JUMPED = 1;
export const TURKEY_LANDED = 2;

/** One leg: dark outline stroke under an orange stroke, with three toes at the foot. */
function drawLeg(ctx, hipX, hipY, kneeX, kneeY, footX, footY) {
  ctx.lineCap = 'round';
  for (const [width, colour] of [[9, PAINT.ink], [5.5, PAINT.legs]]) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
    ctx.stroke();
  }
  for (const dx of [-7, 1, 8]) {
    ctx.strokeStyle = PAINT.legs;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + dx, footY + 4);
    ctx.stroke();
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + dx, footY + 4);
    ctx.stroke();
  }
}

/** Draw the turkey facing right, feet at (this.x, this.y). */
export function drawTurkey(ctx, t) {
  const duck = t.duck;
  const h = 1 - 0.42 * duck; // vertical squash factor
  const grounded = t.onGround;
  const bob = grounded ? Math.sin(t.animT * 18) * 3 : 0;
  const lean = grounded ? 0.12 + duck * 0.5 : -0.1;
  const bodyY = -58 * h + bob;
  const bodyRX = 34 * (1 + 0.22 * duck);
  const bodyRY = 26 * h;

  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.invulnT > 0 && Math.floor(t.invulnT * 14) % 2 === 0) ctx.globalAlpha = 0.45;

  // --- tail fan (behind the body, pointing back and up) ---
  const fanBase = { x: -bodyRX * 0.75, y: bodyY - 4 };
  const spread = 1.5 - duck * 0.5;
  for (let i = 0; i < 7; i += 1) {
    const f = i / 6 - 0.5;
    const a = Math.PI - f * spread - 0.15;
    const len = 58 - Math.abs(f) * 18;
    const tip = i % 2 === 0 ? PAINT.butter : PAINT.cream;
    featherVane(ctx, fanBase.x, fanBase.y, a, len, PAINT.turkeyDark, tip);
    // dark band near the tip
    ctx.save();
    ctx.globalAlpha = 0.5;
    featherVane(ctx, fanBase.x + Math.cos(a) * len * 0.55, fanBase.y + Math.sin(a) * len * 0.55, a, len * 0.28, PAINT.rust, PAINT.rust);
    ctx.restore();
  }

  // --- legs ---
  const phase = t.animT * 11;
  for (let i = 0; i < 2; i += 1) {
    const p = phase + i * Math.PI;
    if (grounded) {
      const swing = Math.sin(p);
      const lift = Math.max(0, Math.cos(p));
      drawLeg(ctx, i * 9 - 4, bodyY + bodyRY * 0.7, swing * 10, -26 * h, swing * 22, -14 * lift);
    } else {
      // tucked and splayed mid-jump
      drawLeg(ctx, i * 9 - 4, bodyY + bodyRY * 0.7, -14 - i * 4, -30, -26 - i * 6, -18 + i * 5);
    }
  }

  // --- body ---
  const grad = ctx.createRadialGradient(4, bodyY - 8, 6, 0, bodyY, bodyRX * 1.4);
  grad.addColorStop(0, PAINT.turkeyBody);
  grad.addColorStop(1, PAINT.turkeyDark);
  setChunkyStyle(ctx, grad);
  ellipsePath(ctx, 0, bodyY, bodyRX, bodyRY, -lean * 0.4);
  ctx.fill();
  ctx.stroke();
  // belly
  ctx.fillStyle = 'rgba(201,138,78,0.85)';
  ellipsePath(ctx, 6, bodyY + bodyRY * 0.42, bodyRX * 0.55, bodyRY * 0.4, -lean * 0.4);
  ctx.fill();

  // --- wing (folds when running, flaps when airborne) ---
  const wingA = grounded ? 0.35 + Math.sin(t.animT * 18) * 0.06 : Math.sin(t.flapT * 16) * 0.85 - 0.4;
  ctx.save();
  ctx.translate(-2, bodyY - 2);
  ctx.rotate(wingA);
  setChunkyStyle(ctx, PAINT.turkeyBelly);
  ellipsePath(ctx, 0, 10, 17, 9);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- neck, head, beak, wattle ---
  const headX = bodyRX * 0.78 + 8 - duck * 14;
  const headY = bodyY - bodyRY - (30 * h) + (grounded ? Math.sin(t.animT * 18 + 1) * 2 : 0);
  ctx.lineCap = 'round';
  for (const [width, colour] of [[17, PAINT.ink], [12, '#d99a6e']]) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(bodyRX * 0.55, bodyY - bodyRY * 0.55);
    ctx.quadraticCurveTo(bodyRX * 0.95, headY + 14, headX, headY);
    ctx.stroke();
  }
  // head
  chunkyEllipse(ctx, headX, headY, 12, 11.5, '#e5b086');
  // brown cap
  ctx.fillStyle = PAINT.turkeyDark;
  ctx.beginPath();
  ctx.arc(headX - 1, headY - 3, 11, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  // beak
  setChunkyStyle(ctx, PAINT.beak);
  ctx.beginPath();
  ctx.moveTo(headX + 8, headY - 2);
  ctx.lineTo(headX + 24, headY + 2);
  ctx.lineTo(headX + 8, headY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // snood dangling over the beak
  ctx.fillStyle = PAINT.wattle;
  ctx.beginPath();
  ctx.moveTo(headX + 9, headY - 6);
  ctx.quadraticCurveTo(headX + 19, headY - 4, headX + 15 + Math.sin(t.animT * 9) * 1.5, headY + 5);
  ctx.quadraticCurveTo(headX + 10, headY + 2, headX + 6, headY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // wattle under the chin
  ctx.fillStyle = PAINT.wattle;
  ellipsePath(ctx, headX + 2, headY + 13, 5, 8);
  ctx.fill();
  ctx.stroke();
  // eye
  const scared = t.scareT > 0;
  chunkyEllipse(ctx, headX + 4, headY - 3, scared ? 6 : 4.6, scared ? 6.4 : 4.6, '#fff6e6', 0);
  ctx.fillStyle = PAINT.ink;
  ctx.beginPath();
  ctx.arc(headX + 5.5, headY - 3 - (scared ? 1 : 0), scared ? 2.2 : 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
