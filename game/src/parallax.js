// Everything behind the action: the parallax sky, hills, farmyard, barn and kitchen scenes, and
// the scrolling ground strip. drawBackdrop(ctx, view) paints one full frame given the yard count
// (which picks the scene), the world scroll (which drives each layer's drift) and the clock time
// (which animates clouds and glow). Zones crossfade over ZONE_BLEND_YARDS.

import { GROUND_Y, PAINT, VIEW_H, VIEW_W, ZONE_BARN, ZONE_FARM, ZONE_KITCHEN, zoneAtYards, zoneBlend } from './config.js';
import { chunkyEllipse, ellipsePath, setChunkyStyle, verticalGradient } from './art.js';

/** Stable pseudo-random jitter for a repeating prop, keyed by its absolute index. */
function propJitter(index, salt) {
  const s = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Draw `make(x, index)` for props repeating every `period` px, drifting with parallax `factor`. */
function repeatLayer(ctx, scrollPx, factor, period, make) {
  const drift = scrollPx * factor;
  const first = Math.floor(drift / period) - 1;
  for (let i = first; i < first + Math.ceil(VIEW_W / period) + 3; i += 1) {
    make(i * period - drift + propJitter(i, factor * 97) * period * 0.3, i);
  }
}

function skyGradient(ctx, stops) {
  ctx.fillStyle = verticalGradient(ctx, 0, GROUND_Y + 40, stops);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function hillBand(ctx, baseline, amp, colour, scrollPx, factor, seedSalt) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, baseline);
  for (let x = 0; x <= VIEW_W; x += 16) {
    const u = (x + scrollPx * factor) * 0.004;
    const y = baseline - Math.sin(u) * amp - Math.sin(u * 2.7 + seedSalt) * amp * 0.45;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

function drawSun(ctx, x, y, r, core, halo, timeSecs) {
  const pulse = 1 + Math.sin(timeSecs * 1.2) * 0.02;
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.6 * pulse);
  glow.addColorStop(0, halo);
  glow.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  // outline-free disc: a rimmed circle in the sky read as a pasted-on egg
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, s, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.6, s * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.9, y + s * 0.15, s * 0.8, s * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 1.0, y + s * 0.1, s * 0.9, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindmill(ctx, x, baseY, s, timeSecs) {
  ctx.save();
  ctx.strokeStyle = PAINT.ink;
  ctx.fillStyle = '#3d2417';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.35, baseY);
  ctx.lineTo(x - s * 0.12, baseY - s * 1.6);
  ctx.lineTo(x + s * 0.12, baseY - s * 1.6);
  ctx.lineTo(x + s * 0.35, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const cx = x;
  const cy = baseY - s * 1.6;
  ctx.translate(cx, cy);
  ctx.rotate(timeSecs * 0.9);
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#4a2c1a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.14, -s * 0.9);
    ctx.lineTo(-s * 0.1, -s * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarn(ctx, x, baseY, s, body, roof) {
  setChunkyStyle(ctx, body);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, baseY);
  ctx.lineTo(x - s * 0.6, baseY - s * 0.75);
  ctx.lineTo(x - s * 0.75, baseY - s * 0.75);
  ctx.lineTo(x, baseY - s * 1.35);
  ctx.lineTo(x + s * 0.75, baseY - s * 0.75);
  ctx.lineTo(x + s * 0.6, baseY - s * 0.75);
  ctx.lineTo(x + s * 0.6, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.82, baseY - s * 0.72);
  ctx.lineTo(x, baseY - s * 1.42);
  ctx.lineTo(x + s * 0.82, baseY - s * 0.72);
  ctx.lineTo(x + s * 0.62, baseY - s * 0.78);
  ctx.lineTo(x, baseY - s * 1.28);
  ctx.lineTo(x - s * 0.62, baseY - s * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // hay-loft door
  ctx.fillStyle = 'rgba(20,10,4,0.55)';
  ctx.fillRect(x - s * 0.14, baseY - s * 0.95, s * 0.28, s * 0.3);
}

function drawSilo(ctx, x, baseY, s) {
  setChunkyStyle(ctx, '#b8b0a0');
  ctx.beginPath();
  ctx.moveTo(x - s * 0.22, baseY);
  ctx.lineTo(x - s * 0.22, baseY - s * 1.7);
  ctx.arc(x, baseY - s * 1.7, s * 0.22, Math.PI, 0);
  ctx.lineTo(x + s * 0.22, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(42,20,8,0.3)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.22, baseY - (s * 1.7 * i) / 5);
    ctx.lineTo(x + s * 0.22, baseY - (s * 1.7 * i) / 5);
    ctx.stroke();
  }
}

function drawFence(ctx, x, baseY, s) {
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 3;
  ctx.fillStyle = '#6b4526';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(x + i * s * 0.5 - 3, baseY - s * 0.8, 6, s * 0.8);
    ctx.strokeRect(x + i * s * 0.5 - 3, baseY - s * 0.8, 6, s * 0.8);
  }
  ctx.fillRect(x - 4, baseY - s * 0.65, s * 1.08, 5);
  ctx.fillRect(x - 4, baseY - s * 0.3, s * 1.08, 5);
}

function drawHaystack(ctx, x, baseY, s) {
  setChunkyStyle(ctx, PAINT.hay);
  ctx.beginPath();
  ctx.moveTo(x - s, baseY);
  ctx.quadraticCurveTo(x, baseY - s * 1.5, x + s, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(42,20,8,0.3)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * s * 0.3, baseY);
    ctx.quadraticCurveTo(x + i * s * 0.18, baseY - s * 0.7, x, baseY - s * 0.95);
    ctx.stroke();
  }
}

/** The farmyard at golden hour: sunset, sun, barn, silo, windmill, fence, rolling green-brown hills. */
function drawFarmScene(ctx, scrollPx, timeSecs) {
  skyGradient(ctx, [
    [0, '#3b1d5e'],
    [0.42, '#8a3160'],
    [0.72, '#e8734a'],
    [1, '#ffc17a'],
  ]);
  drawSun(ctx, 960, 330, 92, '#ffd98a', 'rgba(255,190,110,0.55)', timeSecs);
  ctx.save();
  ctx.globalAlpha = 0.4;
  repeatLayer(ctx, scrollPx, 0.06, 520, (x, i) => drawCloud(ctx, x, 70 + propJitter(i, 3) * 90, 30 + propJitter(i, 7) * 22, '#f6b98a'));
  ctx.restore();
  hillBand(ctx, 470, 26, '#5a3b52', scrollPx, 0.12, 1.7);
  hillBand(ctx, 505, 20, '#4a3033', scrollPx, 0.22, 4.1);
  repeatLayer(ctx, scrollPx, 0.34, 1500, (x, i) => {
    drawBarn(ctx, x + 300, 512, 120, '#8a3a2e', '#5e2620');
    drawSilo(ctx, x + 430, 512, 110);
    if (propJitter(i, 11) > 0.5) drawWindmill(ctx, x + 90, 512, 55, timeSecs);
  });
  hillBand(ctx, 532, 12, '#49682f', scrollPx, 0.42, 5.9);
  hillBand(ctx, 552, 10, '#557a35', scrollPx, 0.55, 2.3);
  repeatLayer(ctx, scrollPx, 0.62, 420, (x, i) => {
    if (propJitter(i, 5) > 0.35) drawFence(ctx, x, 566, 60);
    else drawHaystack(ctx, x, 566, 34);
  });
}

/** The barn mile: deeper dusk, stars, moon, big dark barn shapes and stacked hay. */
function drawBarnScene(ctx, scrollPx, timeSecs) {
  skyGradient(ctx, [
    [0, '#141031'],
    [0.5, '#2c1a4a'],
    [0.8, '#6b2f52'],
    [1, '#c96a3f'],
  ]);
  ctx.fillStyle = '#ffedb8';
  for (let i = 0; i < 40; i += 1) {
    const x = (propJitter(i, 13) * (VIEW_W + 200) - scrollPx * 0.04) % (VIEW_W + 200);
    const y = propJitter(i, 17) * 300;
    const tw = 0.5 + 0.5 * Math.sin(timeSecs * 2 + i * 1.7);
    ctx.globalAlpha = 0.25 + 0.55 * tw;
    ctx.fillRect((x + VIEW_W + 200) % (VIEW_W + 200) - 100, y, 2.4, 2.4);
  }
  ctx.globalAlpha = 1;
  drawSun(ctx, 300, 180, 52, '#f4e9c8', 'rgba(244,233,200,0.3)', timeSecs);
  hillBand(ctx, 470, 22, '#241634', scrollPx, 0.12, 0.9);
  repeatLayer(ctx, scrollPx, 0.3, 1200, (x) => {
    drawBarn(ctx, x + 240, 520, 150, '#4c1f1a', '#321310');
  });
  hillBand(ctx, 540, 12, '#2c2018', scrollPx, 0.48, 3.1);
  repeatLayer(ctx, scrollPx, 0.6, 360, (x, i) => {
    if (propJitter(i, 23) > 0.5) drawHaystack(ctx, x, 562, 42);
    else drawFence(ctx, x, 562, 56);
  });
}

/** Inside the kitchen: panelled walls, a night window, a rail of hanging pots, warm fridge light. */
function drawKitchenScene(ctx, scrollPx, timeSecs) {
  skyGradient(ctx, [
    [0, '#2e1a12'],
    [0.6, '#4a2a18'],
    [1, '#5d3620'],
  ]);
  // wall panelling lines
  ctx.strokeStyle = 'rgba(20,10,4,0.35)';
  ctx.lineWidth = 3;
  const panelDrift = (scrollPx * 0.3) % 160;
  for (let x = -panelDrift; x < VIEW_W + 160; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 520);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(20,10,4,0.35)';
  ctx.fillRect(0, 60, VIEW_W, 6);
  ctx.fillRect(0, 516, VIEW_W, 6);
  // night window repeating down the wall
  repeatLayer(ctx, scrollPx, 0.3, 900, (x) => {
    const wx = x + 220;
    ctx.fillStyle = '#1a2440';
    ctx.fillRect(wx, 140, 190, 150);
    const g = ctx.createLinearGradient(0, 140, 0, 290);
    g.addColorStop(0, '#101a33');
    g.addColorStop(1, '#26365e');
    ctx.fillStyle = g;
    ctx.fillRect(wx, 140, 190, 150);
    ctx.fillStyle = '#f4e9c8';
    ctx.beginPath();
    ctx.arc(wx + 140, 180, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20120a';
    ctx.lineWidth = 7;
    ctx.strokeRect(wx, 140, 190, 150);
    ctx.beginPath();
    ctx.moveTo(wx + 95, 140);
    ctx.lineTo(wx + 95, 290);
    ctx.moveTo(wx, 215);
    ctx.lineTo(wx + 190, 215);
    ctx.lineWidth = 5;
    ctx.stroke();
  });
  // rail of hanging pots and ladles
  const railY = 96;
  ctx.strokeStyle = '#241610';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(VIEW_W, railY);
  ctx.stroke();
  repeatLayer(ctx, scrollPx, 0.42, 240, (x, i) => {
    const j = propJitter(i, 29);
    const sway = Math.sin(timeSecs * 1.6 + i * 2.1) * 0.05;
    ctx.save();
    ctx.translate(x + 60, railY);
    ctx.rotate(sway);
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = 3;
    if (j > 0.5) {
      ctx.fillStyle = '#8d97a6';
      ctx.beginPath();
      ctx.moveTo(-26, 14);
      ctx.lineTo(26, 14);
      ctx.lineTo(20, 62);
      ctx.lineTo(-20, 62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#b7bec9';
      ctx.beginPath();
      ctx.arc(0, 44, 20, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(0, 26);
      ctx.stroke();
    }
    ctx.restore();
  });
  // oven glow pulsing along the base of the far wall
  const glowX = 1050 - ((scrollPx * 0.3) % 1400);
  const glow = ctx.createRadialGradient(glowX, 520, 20, glowX, 520, 260);
  glow.addColorStop(0, `rgba(255,122,47,${0.35 + 0.08 * Math.sin(timeSecs * 5)})`);
  glow.addColorStop(1, 'rgba(255,122,47,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(glowX - 280, 240, 560, 320);
}

/** The dirt (or tile) the runner actually runs on, scrolling 1:1 with the world. */
function drawGround(ctx, scrollPx, zone) {
  const top = GROUND_Y;
  if (zone === ZONE_KITCHEN) {
    ctx.fillStyle = verticalGradient(ctx, top, VIEW_H, [['#7a6a58', 0], ['#4d4034', 1]].map(([c, o]) => [o, c]));
    ctx.fillRect(0, top, VIEW_W, VIEW_H - top);
    ctx.strokeStyle = 'rgba(20,10,4,0.4)';
    ctx.lineWidth = 2;
    const drift = scrollPx % 96;
    for (let x = -drift; x < VIEW_W + 96; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x - 40, VIEW_H);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, top + 34);
    ctx.lineTo(VIEW_W, top + 34);
    ctx.stroke();
  } else {
    ctx.fillStyle = verticalGradient(ctx, top, VIEW_H, [
      [0, '#6b4a26'],
      [0.25, '#57391d'],
      [1, '#3c2612'],
    ]);
    ctx.fillRect(0, top, VIEW_W, VIEW_H - top);
    // grass fringe on top of the dirt
    ctx.fillStyle = zone === ZONE_BARN ? '#2c3f20' : '#4a6b2c';
    const gd = scrollPx % 26;
    ctx.beginPath();
    for (let x = -gd; x < VIEW_W + 26; x += 26) {
      ctx.moveTo(x, top + 4);
      ctx.quadraticCurveTo(x + 6, top - 9, x + 13, top + 3);
      ctx.quadraticCurveTo(x + 19, top - 6, x + 26, top + 4);
    }
    ctx.lineTo(VIEW_W, top + 12);
    ctx.lineTo(0, top + 12);
    ctx.closePath();
    ctx.fill();
    // pebbles
    ctx.fillStyle = 'rgba(20,10,4,0.35)';
    const pd = scrollPx % 7;
    for (let i = 0; i < 26; i += 1) {
      const x = ((propJitter(i, pd) * (VIEW_W + 60)) + i * 47 - scrollPx) % (VIEW_W + 60);
      const y = top + 22 + propJitter(i, 37) * (VIEW_H - top - 40);
      ellipsePath(ctx, (x + VIEW_W + 60) % (VIEW_W + 60) - 30, y, 3 + propJitter(i, 41) * 4, 2 + propJitter(i, 43) * 2);
      ctx.fill();
    }
  }
  // hard lip line
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(VIEW_W, top);
  ctx.stroke();
}

/** Paint the whole backdrop for one frame of `view` ({yards, scrollPx, timeSecs}). */
export function drawBackdrop(ctx, view) {
  const zone = zoneAtYards(view.yards);
  const blend = zoneBlend(view.yards);
  const sceneFor = (z) => {
    if (z === ZONE_FARM) drawFarmScene(ctx, view.scrollPx, view.timeSecs);
    else if (z === ZONE_BARN) drawBarnScene(ctx, view.scrollPx, view.timeSecs);
    else drawKitchenScene(ctx, view.scrollPx, view.timeSecs);
  };
  sceneFor(zone);
  if (blend > 0.01) {
    const next = zone === ZONE_FARM ? ZONE_BARN : ZONE_KITCHEN;
    ctx.save();
    ctx.globalAlpha = blend;
    sceneFor(next);
    ctx.restore();
  }
  drawGround(ctx, view.scrollPx, zone);
}
