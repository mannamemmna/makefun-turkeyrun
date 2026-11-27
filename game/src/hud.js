// The heads-up display during a run: three hearts, the score and best, the zone name, and a
// progress rail from the farmyard to the freedom fence with a little turkey marker crawling it.
// Reads world state; never touches it.

import { ESCAPE_YARDS, MAX_LIVES, PAINT, VIEW_W } from './config.js';
import { captionText, chunkyHeart, chunkyRoundRect, displayText, ellipsePath, setChunkyStyle } from './art.js';

const RAIL_X = 330;
const RAIL_W = VIEW_W - 660;

export function drawHud(ctx, world) {
  // Hearts, top-left.
  for (let i = 0; i < MAX_LIVES; i += 1) {
    const alive = i < world.lives;
    chunkyHeart(ctx, 52 + i * 54, 52, 20, alive ? PAINT.heart : 'rgba(60,30,20,0.55)');
    if (alive) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(45 + i * 54, 44, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Score and best, top-centre-left under the hearts.
  displayText(ctx, String(world.score).padStart(5, '0'), 78, 116, 40, PAINT.cream, 'center');
  captionText(ctx, `BEST ${String(world.best).padStart(5, '0')}`, 78, 150, 18, PAINT.butter, 'center');

  // Zone name, top-right.
  const zoneLabel = world.zone === 'farm' ? 'FARMYARD' : world.zone === 'barn' ? 'THE BARN MILE' : 'KITCHEN!';
  captionText(ctx, zoneLabel, VIEW_W - 60, 148, 20, PAINT.butter, 'right');

  // Progress rail to freedom.
  const t = Math.min(1, world.yards / ESCAPE_YARDS);
  chunkyRoundRect(ctx, RAIL_X, 40, RAIL_W, 14, 7, 'rgba(74,44,22,0.85)');
  chunkyRoundRect(ctx, RAIL_X + 2, 42, Math.max(6, (RAIL_W - 4) * t), 10, 5, PAINT.butter);
  // fence post at the finish end
  ctx.strokeStyle = PAINT.butter;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(RAIL_X + RAIL_W + 12, 28);
  ctx.lineTo(RAIL_X + RAIL_W + 12, 66);
  ctx.moveTo(RAIL_X + RAIL_W + 4, 36);
  ctx.lineTo(RAIL_X + RAIL_W + 20, 36);
  ctx.moveTo(RAIL_X + RAIL_W + 4, 54);
  ctx.lineTo(RAIL_X + RAIL_W + 20, 54);
  ctx.stroke();
  // mini turkey marker
  const mx = RAIL_X + RAIL_W * t;
  setChunkyStyle(ctx, PAINT.turkeyBody);
  ellipsePath(ctx, mx, 30, 8, 6);
  ctx.fill();
  ctx.stroke();
  setChunkyStyle(ctx, PAINT.turkeyDark);
  ellipsePath(ctx, mx - 8, 24, 4, 6, -0.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAINT.wattle;
  ctx.beginPath();
  ctx.arc(mx + 7, 26, 2.4, 0, Math.PI * 2);
  ctx.fill();

  captionText(ctx, `${Math.floor(world.yards)} / ${ESCAPE_YARDS} yd to freedom`, RAIL_X + RAIL_W / 2, 72, 17, PAINT.cream, 'center');
}

/** The pause plate: dim centre card that says PAUSED and how to leave it. */
export function drawPausePlate(ctx) {
  ctx.fillStyle = 'rgba(15,8,3,0.55)';
  ctx.fillRect(0, 0, VIEW_W, 720);
  chunkyRoundRect(ctx, VIEW_W / 2 - 220, 260, 440, 180, 22, 'rgba(42,20,8,0.92)');
  displayText(ctx, 'PAUSED', VIEW_W / 2, 322, 58, PAINT.cream);
  captionText(ctx, 'P to resume', VIEW_W / 2, 386, 24, PAINT.butter);
}
