// The three full-screen plates the judge's contact sheet lives on: the title card with a giant
// turkey portrait and the farmer's shadow, the CAUGHT screen (the oven gag: a golden-roast turkey
// lying in the door glass with X eyes), and the ESCAPED screen (dawn over the freedom field with
// a banner). Each draws over whatever backdrop the world already painted and never mutates it.

import { ESCAPE_YARDS, GROUND_Y, PAINT, VIEW_H, VIEW_W } from './config.js';
import { captionText, chunkyEllipse, chunkyRoundRect, chunkyStar, displayText, ellipsePath, featherVane, roundRectPath, setChunkyStyle, verticalGradient } from './art.js';
import { drawLoomingFarmer } from './farmer.js';
import { drawCarvingKnife } from './hazards.js';
import { Turkey, drawTurkey } from './turkey.js';

/** Soft dark vignette so screen text pops at thumbnail size. */
function vignette(ctx, strength = 0.5) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 260, VIEW_W / 2, VIEW_H / 2, 820);
  g.addColorStop(0, 'rgba(10,4,1,0)');
  g.addColorStop(1, `rgba(10,4,1,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// ---------------------------------------------------------------- title ----

export function drawTitleScreen(ctx, timeSecs, best) {
  // Poster composition: giant lettering on top, the chase underneath — farmer with raised fork
  // at the left, a glinting carving knife mid-flight, the hero turkey enormous at the right.
  vignette(ctx, 0.5);

  // the farmer, full colour, looming in at the left edge — fork tip kept clear of the lettering
  const farmerGlow = ctx.createRadialGradient(110, GROUND_Y - 160, 30, 110, GROUND_Y - 160, 260);
  farmerGlow.addColorStop(0, 'rgba(255,190,120,0.3)');
  farmerGlow.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = farmerGlow;
  ctx.fillRect(-150, GROUND_Y - 440, 520, 460);
  drawLoomingFarmer(ctx, 60, GROUND_Y + 6, 1.7, 1, 1);

  // hero turkey portrait, half the frame tall, caught mid-panic-flight: lifted clear of the
  // ground over its own shadow, leaning forward into the bolt, dust kicked up behind — the pose
  // alone must sell "run" at contact-sheet size
  const pose = new Turkey();
  pose.x = 0;
  pose.y = 0;
  pose.onGround = false;
  pose.animT = timeSecs;
  pose.flapT = 0.32;
  pose.scareT = 1;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = PAINT.ink;
  ellipsePath(ctx, 1010, GROUND_Y + 14, 96, 16);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(169,138,95,0.85)';
  for (const [dx, dy, dr] of [[-120, -30, 17], [-156, -52, 13], [-130, -74, 10], [-178, -24, 9]]) {
    ctx.beginPath();
    ctx.arc(1010 + dx, GROUND_Y + dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(1030, GROUND_Y - 80);
  ctx.rotate(0.12);
  ctx.scale(3.15, 3.15);
  drawTurkey(ctx, pose);
  ctx.restore();

  // one carving knife in flight, aimed at the turkey: big steel blade, wooden handle toward the
  // farmer, speed streaks behind it — no fat sparkles that read as magic at thumbnail size
  ctx.save();
  ctx.translate(360, 410);
  ctx.rotate(-0.25);
  setChunkyStyle(ctx, '#7d5330');
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-96, 26);
  ctx.lineTo(-26, 10);
  ctx.stroke();
  drawCarvingKnife(ctx, 180);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,237,207,0.6)';
  ctx.lineWidth = 5;
  for (const [sy, sl] of [[388, 66], [414, 92], [440, 56]]) {
    ctx.beginPath();
    ctx.moveTo(222, sy);
    ctx.lineTo(222 + sl, sy - 7);
    ctx.stroke();
  }
  chunkyStar(ctx, 424, 372, 8, 'rgba(255,237,207,0.9)', -timeSecs * 0.4);

  // thick speed lines trailing the hero, overlapping its dust cloud — bird is moving, not props
  ctx.strokeStyle = 'rgba(255,237,207,0.65)';
  ctx.lineWidth = 8;
  for (const [ly, lx0, lx1] of [[430, 730, 850], [490, 690, 860], [550, 745, 855]]) {
    ctx.beginPath();
    ctx.moveTo(lx0, ly);
    ctx.lineTo(lx1, ly);
    ctx.stroke();
  }

  // title lettering: huge, centred high, strong butter-on-dark with a heavy outline
  displayText(ctx, 'TURKEY RUN', 660, 148, 122, PAINT.butter);

  // tagline ribbon: the gag in four words, clear of the turkey's tail sweep
  setChunkyStyle(ctx, PAINT.wattle);
  ctx.beginPath();
  ctx.moveTo(300, 240);
  ctx.quadraticCurveTo(600, 208, 900, 240);
  ctx.lineTo(900, 306);
  ctx.quadraticCurveTo(600, 274, 300, 306);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  displayText(ctx, "DON'T BECOME DINNER", 600, 276, 40, PAINT.cream);

  // play prompt: a solid pill anyone can read at postage-stamp size
  const hot = 0.5 + 0.5 * Math.sin(timeSecs * 4);
  setChunkyStyle(ctx, hot > 0.5 ? '#d9532f' : '#b83f1d');
  roundRectPath(ctx, 440, 606, 400, 66, 18);
  ctx.fill();
  ctx.stroke();
  displayText(ctx, 'PRESS SPACE TO RUN', 640, 648, 34, PAINT.cream);

  // best score corner note; no control legend — it is noise at contact-sheet size
  if (best > 0) captionText(ctx, `BEST ${best}`, 1240, 40, 20, PAINT.corn, 'right');
}

// --------------------------------------------------------------- helpers ----

function statsLines(ctx, world, cy) {
  captionText(ctx, `${Math.floor(world.yards)} of ${ESCAPE_YARDS} yards · ${world.lives} heart${world.lives === 1 ? '' : 's'} left`, VIEW_W / 2, cy, 26, PAINT.cream);
  displayText(ctx, `SCORE ${world.score}`, VIEW_W / 2, cy + 46, 44, PAINT.butter);
  captionText(ctx, `BEST ${Math.max(world.best, world.score)}`, VIEW_W / 2, cy + 86, 24, PAINT.corn);
}

function restartPrompt(ctx, text, timeSecs, y = 692) {
  const blink = 0.8 + 0.2 * Math.sin(timeSecs * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  displayText(ctx, text, VIEW_W / 2, y, 34, PAINT.butter);
  ctx.restore();
}

// --------------------------------------------------------------- caught ----

/** The roast turkey lying in the oven door: golden, plump, X eyes, lemon and parsley. */
function drawRoastGag(ctx, cx, cy, s, timeSecs) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // platter
  setChunkyStyle(ctx, '#d8d2c4');
  ellipsePath(ctx, 0, 54, 150, 30);
  ctx.fill();
  ctx.stroke();
  // body: glossy roast gradient
  const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, 110);
  g.addColorStop(0, '#e8a352');
  g.addColorStop(0.6, '#b46a24');
  g.addColorStop(1, '#7c4214');
  setChunkyStyle(ctx, g);
  ellipsePath(ctx, 0, 0, 96, 62, -0.08);
  ctx.fill();
  ctx.stroke();
  // drumsticks crossed on top
  for (const side of [-1, 1]) {
    setChunkyStyle(ctx, '#a55e1f');
    ctx.beginPath();
    ctx.moveTo(side * 18, -30);
    ctx.quadraticCurveTo(side * 62, -74, side * 78, -62);
    ctx.quadraticCurveTo(side * 86, -52, side * 74, -44);
    ctx.quadraticCurveTo(side * 50, -30, side * 26, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // bone nub
    setChunkyStyle(ctx, PAINT.cream);
    ctx.beginPath();
    ctx.arc(side * 80, -58, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // head slumped to the side, X eyes and weak grin (comic, not gruesome)
  setChunkyStyle(ctx, '#b46a24');
  ellipsePath(ctx, -86, 26, 26, 22, 0.3);
  ctx.fill();
  ctx.stroke();
  // beak
  setChunkyStyle(ctx, PAINT.beak);
  ctx.beginPath();
  ctx.moveTo(-106, 24);
  ctx.lineTo(-126, 32);
  ctx.lineTo(-104, 38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 4;
  for (const [ex, ey] of [[-92, 18], [-78, 22]]) {
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 5);
    ctx.lineTo(ex + 5, ey + 5);
    ctx.moveTo(ex + 5, ey - 5);
    ctx.lineTo(ex - 5, ey + 5);
    ctx.stroke();
  }
  // gloss highlights + steam
  ctx.fillStyle = 'rgba(255,237,207,0.5)';
  ellipsePath(ctx, -24, -28, 26, 10, -0.4);
  ctx.fill();
  // fresh butter baste: shiny dollops and a drip, the gag's "just basted" proof
  ctx.fillStyle = 'rgba(255,244,180,0.85)';
  for (const [bx, by, br] of [[30, -18, 7], [-6, -40, 5], [58, 6, 6], [-48, -12, 5]]) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(30, -12);
  ctx.quadraticCurveTo(33, 0, 30, 10);
  ctx.quadraticCurveTo(27, 0, 30, -12);
  ctx.fill();
  // meat thermometer plunged in, dial reading DONE — dial kept apart from the bone nubs
  ctx.save();
  ctx.translate(95, -18);
  ctx.rotate(0.9);
  ctx.strokeStyle = '#9aa4ad';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 46);
  ctx.stroke();
  chunkyEllipse(ctx, 0, -12, 14, 14, '#cfd8e3');
  ctx.strokeStyle = PAINT.wattle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(7, -18);
  ctx.stroke();
  ctx.restore();
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = PAINT.ink;
  ctx.strokeText('DONE', 128, -50);
  ctx.fillStyle = PAINT.cream;
  ctx.fillText('DONE', 128, -50);
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(255,237,207,0.5)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i += 1) {
    const sx = -40 + i * 44;
    const wob = Math.sin(timeSecs * 3 + i * 2) * 6;
    ctx.beginPath();
    ctx.moveTo(sx, -66);
    ctx.quadraticCurveTo(sx + wob, -96, sx - wob, -126);
    ctx.stroke();
  }
  // lemon slice and parsley
  setChunkyStyle(ctx, '#ffe14d');
  ctx.beginPath();
  ctx.arc(70, 34, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8b93a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(70, 34);
    ctx.lineTo(70 + Math.cos(a) * 16, 34 + Math.sin(a) * 16);
    ctx.stroke();
  }
  ctx.fillStyle = '#4e7d2c';
  for (const [px, py] of [[-58, 52], [40, 52]]) {
    ctx.beginPath();
    ctx.ellipse(px, py, 14, 6, py === 52 ? 0.4 : -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCaughtScreen(ctx, world) {
  // kitchen gloom over whatever backdrop was painted
  ctx.fillStyle = verticalGradient(ctx, 0, VIEW_H, [
    [0, 'rgba(20,6,2,0.82)'],
    [1, 'rgba(60,10,4,0.86)'],
  ]);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // the oven: a proper range — top control panel, ember door, handle bar, kick drawer
  const ox = VIEW_W / 2;
  chunkyRoundRect(ctx, ox - 250, 170, 500, 360, 20, '#6b727d');
  // control panel strip with knobs and a hot display
  chunkyRoundRect(ctx, ox - 236, 180, 472, 52, 12, '#565b64');
  for (let i = 0; i < 4; i += 1) {
    const kx = ox - 190 + i * 44;
    chunkyEllipse(ctx, kx, 206, 14, 14, '#d8d2c4');
    ctx.strokeStyle = PAINT.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(kx, 206);
    ctx.lineTo(kx + 8, 199);
    ctx.stroke();
  }
  chunkyRoundRect(ctx, ox + 66, 190, 160, 32, 8, '#1a1614');
  captionText(ctx, '350\u00b0F', ox + 146, 214, 22, PAINT.fire, 'center');

  // the door: dark frame, ember glass, roast visible inside — no mirror glare, it cooks, it does not screen
  chunkyRoundRect(ctx, ox - 236, 244, 472, 226, 14, '#2b2f35');
  const gg = ctx.createRadialGradient(ox, 356, 20, ox, 356, 240);
  gg.addColorStop(0, '#ffb14d');
  gg.addColorStop(0.55, '#d9541f');
  gg.addColorStop(1, '#5c1608');
  chunkyRoundRect(ctx, ox - 220, 254, 440, 206, 10, gg);
  // heat shimmer bars at the glass edges sell the "inside a hot chamber"
  ctx.fillStyle = 'rgba(255,150,60,0.25)';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(ox - 214, 262 + i * 8, 428, 3);
    ctx.fillRect(ox - 214, 440 + i * 8, 428, 3);
  }
  // the gag itself, inside the door
  drawRoastGag(ctx, ox, 362, 0.92, world.timeSecs);
  // handle bar directly under the door
  chunkyRoundRect(ctx, ox - 190, 478, 380, 16, 8, '#aab4bf');
  chunkyRoundRect(ctx, ox - 196, 474, 12, 24, 4, '#4a4e56');
  chunkyRoundRect(ctx, ox + 184, 474, 12, 24, 4, '#4a4e56');
  // warming-drawer kick line
  ctx.strokeStyle = '#4a4e56';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ox - 220, 512);
  ctx.lineTo(ox + 220, 512);
  ctx.stroke();

  displayText(ctx, 'CAUGHT!', VIEW_W / 2, 92, 96, PAINT.wattle);
  captionText(ctx, 'Thanksgiving dinner is served… but not for you.', VIEW_W / 2, 142, 28, PAINT.cream);
  statsLines(ctx, world, 578);
  restartPrompt(ctx, 'PRESS SPACE TO ESCAPE AGAIN', world.timeSecs, 700);
}

// -------------------------------------------------------------- escaped ----

export function drawEscapedScreen(ctx, world) {
  // dawn over the freedom field replaces the gloom
  ctx.fillStyle = verticalGradient(ctx, 0, VIEW_H, [
    [0, '#2c4a6e'],
    [0.35, '#e8935a'],
    [0.62, '#ffd98a'],
    [1, '#ffe9b8'],
  ]);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // rising sun with rays — small enough to read as a dawn, not a plate behind the hero
  const sx = VIEW_W / 2;
  const sy = 380;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(world.timeSecs * 0.05);
  ctx.fillStyle = 'rgba(255,240,190,0.22)';
  for (let i = 0; i < 12; i += 1) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(560, -34);
    ctx.lineTo(560, 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  chunkyEllipse(ctx, sx, sy, 72, 72, '#fff2c4');

  // rolling green freedom field
  ctx.fillStyle = '#5f8a3c';
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, 520);
  ctx.quadraticCurveTo(320, 470, 640, 516);
  ctx.quadraticCurveTo(960, 560, VIEW_W, 508);
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();

  // the farm he left behind: barn and silo in dark silhouette on the far hill, moon above them
  // (kept clear of the freedom fence post at x 180 so neither silhouette fuses into the other)
  ctx.fillStyle = 'rgba(30,16,32,0.82)';
  ctx.beginPath();
  ctx.moveTo(55, 500);
  ctx.lineTo(55, 430);
  ctx.lineTo(85, 398);
  ctx.lineTo(115, 430);
  ctx.lineTo(115, 500);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(130, 420, 22, 80);
  ctx.beginPath();
  ctx.arc(141, 420, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,244,214,0.85)';
  ctx.beginPath();
  ctx.arc(95, 320, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,190,150,0.5)';
  ctx.beginPath();
  ctx.arc(87, 314, 6, 0, Math.PI * 2);
  ctx.arc(103, 328, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4c7531';
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, 590);
  ctx.quadraticCurveTo(640, 540, VIEW_W, 600);
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();

  // open paddock gate the turkey just burst through
  ctx.strokeStyle = '#6b4526';
  ctx.lineWidth = 10;
  for (const gx of [180, 1100]) {
    ctx.beginPath();
    ctx.moveTo(gx, 560);
    ctx.lineTo(gx, 400);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(180, 430);
  ctx.rotate(-0.5);
  ctx.strokeStyle = '#7d5330';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(150, 6);
  ctx.moveTo(0, 60);
  ctx.lineTo(150, 66);
  ctx.stroke();
  ctx.restore();

  // the farmer, furious at the fence line, fork and fist going — big enough to register as a character
  drawLoomingFarmer(ctx, 1120, 545, 0.95, 0.95, -1);
  captionText(ctx, '(muttering threats at the horizon)', 1120, 610, 17, PAINT.cream);

  // hero turkey mid-victory-leap, centre
  const pose = new Turkey();
  pose.x = 0;
  pose.y = 0;
  pose.onGround = false;
  pose.animT = world.timeSecs;
  pose.flapT = world.timeSecs;
  ctx.save();
  ctx.translate(sx, 512 + Math.sin(world.timeSecs * 2.4) * 10);
  ctx.scale(1.9, 1.9);
  drawTurkey(ctx, pose);
  ctx.restore();

  // banner ribbon across the sky
  ctx.save();
  setChunkyStyle(ctx, PAINT.wattle);
  ctx.beginPath();
  ctx.moveTo(210, 150);
  ctx.quadraticCurveTo(VIEW_W / 2, 96, 1070, 150);
  ctx.lineTo(1070, 236);
  ctx.quadraticCurveTo(VIEW_W / 2, 182, 210, 236);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // ribbon tails
  for (const [tx, tilt] of [[170, 0.35], [1110, -0.35]]) {
    ctx.save();
    ctx.translate(tx, 170);
    ctx.rotate(tilt);
    setChunkyStyle(ctx, '#b03328');
    ctx.beginPath();
    ctx.rect(-46, -20, 92, 40);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  displayText(ctx, 'FREE AT LAST!', VIEW_W / 2, 168, 74, PAINT.cream);
  captionText(ctx, 'Happy Thanksgiving to everyone except the farmer.', VIEW_W / 2, 262, 28, PAINT.cream);
  chunkyStar(ctx, 320, 300, 16, PAINT.butter, world.timeSecs);
  chunkyStar(ctx, 960, 290, 13, PAINT.butter, -world.timeSecs);

  statsLines(ctx, { ...world, yards: ESCAPE_YARDS }, 560);
  restartPrompt(ctx, 'PRESS SPACE TO RUN AGAIN', world.timeSecs, 682);
}
