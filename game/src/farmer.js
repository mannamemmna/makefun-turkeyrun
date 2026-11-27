// The farmer at the player's back: a looming straw-hat silhouette with a pitchfork, drawn behind
// the turkey on the left edge of the screen. `closeness` (0..1) says how hot the chase is — he
// slides further into frame and strides taller as it grows, and lunges for a beat after every hit.

import { GROUND_Y, PAINT, VIEW_W } from './config.js';
import { setChunkyStyle } from './art.js';

const INK_BODY = '#241509';

export class FarmerChaser {
  constructor() {
    this.reset();
  }

  reset() {
    this.closeness = 0.15; // starts contentedly far back
    this.strideT = 0;
    this.lungeT = 0;
    this.forkAngle = 0;
  }

  /** Advance the stride clock; `hype` briefly raises him after a hit (from world events). */
  update(dt, scrollSpeed) {
    this.strideT += dt * (2.6 + scrollSpeed * 0.004);
    this.lungeT = Math.max(0, this.lungeT - dt);
    this.forkAngle = Math.sin(this.strideT * 2) * 0.18;
    // He closes a little every second he is unseen, and relaxes when the turkey is not strafing.
    this.closeness = Math.min(1, this.closeness + dt * 0.004);
  }

  /** Called by the world when the turkey takes a hit: the farmer surges forward. */
  celebrate() {
    this.lungeT = 0.9;
    this.closeness = Math.min(1, this.closeness + 0.16);
  }

  /** How much of the farmer is on screen (for staging screenshots). */
  get onScreen() {
    return -170 + this.closeness * 300 + this.lungeT * 60;
  }

  draw(ctx) {
    const baseX = this.onScreen;
    if (baseX < -160) return;
    const scale = 1.35 + this.closeness * 0.5;
    const bob = Math.abs(Math.sin(this.strideT)) * 8 * scale;
    const lunge = this.lungeT > 0 ? (0.9 - this.lungeT) * 30 : 0;
    const y = GROUND_Y + 4 - bob;
    const alpha = 0.55 + this.closeness * 0.4;

    // warm backlight so the silhouette separates from whatever scenery is behind him
    const halo = ctx.createRadialGradient(baseX + 30, y - 130, 20, baseX + 30, y - 130, 230);
    halo.addColorStop(0, 'rgba(255,190,120,0.28)');
    halo.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(baseX - 200, y - 360, 460, 380);

    ctx.save();
    ctx.translate(baseX + lunge, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(0.95, alpha);

    // legs mid-stride
    const swing = Math.sin(this.strideT) * 14;
    ctx.strokeStyle = INK_BODY;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, -46);
      ctx.lineTo(s * 4 + swing * s * 0.6, -20);
      ctx.lineTo(s * 6 + swing, 0);
      ctx.stroke();
    }
    // torso in overalls
    setChunkyStyle(ctx, INK_BODY);
    ctx.beginPath();
    ctx.moveTo(-16, -44);
    ctx.quadraticCurveTo(-24, -84, -12, -108);
    ctx.lineTo(14, -110);
    ctx.quadraticCurveTo(26, -82, 18, -44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // overall bib highlight
    ctx.fillStyle = 'rgba(255,237,207,0.08)';
    ctx.fillRect(-8, -92, 18, 26);
    // head under a straw hat
    ctx.fillStyle = INK_BODY;
    ctx.beginPath();
    ctx.arc(6, -122, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -130, 26, 6, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -130);
    ctx.quadraticCurveTo(6, -152, 20, -130);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,217,138,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // angry eye glint
    ctx.fillStyle = 'rgba(255,120,90,0.75)';
    ctx.beginPath();
    ctx.arc(13, -122, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // pitching arm + pitchfork, thrust toward the turkey
    ctx.save();
    ctx.translate(16, -96);
    ctx.rotate(-0.5 + this.forkAngle - lunge * 0.02);
    ctx.strokeStyle = INK_BODY;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(34, -6);
    ctx.stroke();
    // fork: shaft then four tines
    ctx.translate(34, -6);
    ctx.rotate(0.12);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(58, 0);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(58 + i * 7 - 10, 0);
      ctx.lineTo(58 + i * 7 - 6, -22);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    // dust cloud at his hooves
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#8a6a42';
    for (let i = 0; i < 5; i += 1) {
      const p = (this.strideT * 1.4 + i * 1.3) % 3;
      ctx.beginPath();
      ctx.arc(baseX - 20 - p * 26, GROUND_Y - 8 - Math.sin(p * 2) * 6, 8 + p * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // In the kitchen stretch a lantern halo trails him (drawn soft, before sprites, from world).
    if (baseX > -60) {
      const g = ctx.createRadialGradient(baseX + 40, GROUND_Y - 140, 10, baseX + 40, GROUND_Y - 140, 220);
      g.addColorStop(0, 'rgba(255,150,70,0.12)');
      g.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = g;
      ctx.fillRect(baseX - 180, GROUND_Y - 360, 440, 360);
    }
  }
}

/**
 * The farmer for the TITLE/ESCAPED plates: a full-colour, recognisable man — straw hat, red
 * plaid shirt, denim overalls, pitchfork raised with steel tines. `facing` 1 leans his fork
 * toward +x (title: turkey on the right), -1 mirrors him (escaped: turkey on the left).
 */
export function drawLoomingFarmer(ctx, x, baseY, scale, alpha = 0.9, facing = 1) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale * facing, scale);
  ctx.globalAlpha = alpha;

  // boots and legs in denim
  setChunkyStyle(ctx, '#39485e');
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.rect(s * 26 - 12, -62, 24, 62);
    ctx.fill();
    ctx.stroke();
  }
  setChunkyStyle(ctx, '#3a2a18');
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(s * 26 - 16, -12, 34, 14, 5);
    ctx.fill();
    ctx.stroke();
  }
  // torso: red plaid shirt, bright enough to read the farmer at contact-sheet size
  setChunkyStyle(ctx, '#b84334');
  ctx.beginPath();
  ctx.moveTo(-40, -58);
  ctx.quadraticCurveTo(-56, -110, -34, -152);
  ctx.lineTo(36, -156);
  ctx.quadraticCurveTo(58, -108, 42, -58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // plaid checks
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(60,16,10,0.5)';
  ctx.lineWidth = 5;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 18, -170);
    ctx.lineTo(i * 18, -40);
    ctx.moveTo(-60, -70 + i * 24);
    ctx.lineTo(60, -70 + i * 24);
    ctx.stroke();
  }
  ctx.restore();
  // overall bib and straps
  setChunkyStyle(ctx, '#39485e');
  ctx.beginPath();
  ctx.roundRect(-22, -128, 46, 72, 8);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#39485e';
  ctx.beginPath();
  ctx.moveTo(-18, -128);
  ctx.lineTo(-30, -154);
  ctx.moveTo(18, -128);
  ctx.lineTo(30, -158);
  ctx.stroke();
  // head: skin, scowl, bushy brow
  setChunkyStyle(ctx, '#e0a878');
  ctx.beginPath();
  ctx.arc(4, -178, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#241509';
  ctx.beginPath();
  ctx.arc(12, -182, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#241509';
  ctx.beginPath();
  ctx.moveTo(4, -190);
  ctx.lineTo(18, -186);
  ctx.moveTo(2, -166);
  ctx.quadraticCurveTo(10, -162, 18, -166);
  ctx.stroke();
  // straw hat
  setChunkyStyle(ctx, '#d9a441');
  ctx.beginPath();
  ctx.ellipse(4, -192, 42, 8, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, -192);
  ctx.quadraticCurveTo(4, -226, 26, -192);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // raised arm gripping the pitchfork, leaned toward the prey
  setChunkyStyle(ctx, '#b84334');
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(32, -142);
  ctx.quadraticCurveTo(58, -156, 66, -184);
  ctx.stroke();
  ctx.save();
  ctx.translate(66, -184);
  ctx.rotate(0.06);
  // pitchfork: long wooden shaft up to a slim steel head — four LONG tines, so even at 384px
  // the silhouette is unmistakably a farm fork and never a brick, mallet or gun barrel
  setChunkyStyle(ctx, '#7d5330');
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-14, 44);
  ctx.lineTo(26, -96);
  ctx.stroke();
  setChunkyStyle(ctx, '#cfd8e3');
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(12, -96);
  ctx.lineTo(40, -96);
  ctx.stroke();
  ctx.lineWidth = 6;
  for (const off of [-14, -5, 5, 14]) {
    ctx.beginPath();
    ctx.moveTo(26 + off, -96);
    ctx.lineTo(28 + off * 1.1, -150);
    ctx.stroke();
  }
  ctx.fillStyle = PAINT.cream;
  for (const off of [-14, -5, 5, 14]) {
    ctx.beginPath();
    ctx.arc(28 + off * 1.1, -150, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

export const FARMER_MIN_SCREEN = -170;
export const FARMER_MAX_SCREEN = VIEW_W;
