// Boot and the one loop. The canvas is a fixed 1280x720 stage; the world advances in fixed 1/60 s
// steps (catching up several in a slow frame, dropping stalls longer than MAX_FRAME), and draws
// once per animation frame. Keys start, restart and pause the run; the sound box unlocks on the
// first real key press.
//
// ?seed=N fixes the spawn pattern of a normal playthrough. ?shot=title|run|caught|escaped (with
// &seed=N) stages that scene with the deterministic autopilot instead of entering the loop,
// paints it twice, and sets window.__shotReady for the screenshot driver.

import { BEST_KEY, STEP_DT, VIEW_H, VIEW_W } from './config.js';
import { createRng, hashSeed } from './rng.js';
import { createKeyboard } from './input.js';
import { createSoundBox } from './audio.js';
import { GameWorld, STATE_CAUGHT, STATE_ESCAPED, STATE_PAUSED, STATE_RUNNING, STATE_TITLE } from './world.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const sound = createSoundBox();
const world = new GameWorld(createRng(hashSeed(seed)), sound);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // storage can be off (private windows): the best then lasts this visit only
  }
}

world.best = readBest();

// ---------------------------------------------------------------- shots ----

function runShot() {
  stageShot(shotName, world);
  let painted = 0;
  const paint = () => {
    world.draw(ctx);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
}

// ----------------------------------------------------------------- play ----

function runGame() {
  const keyboard = createKeyboard();
  const unlockOnce = () => sound.unlock();
  window.addEventListener('keydown', unlockOnce, { once: true });
  window.addEventListener('pointerdown', unlockOnce, { once: true });

  let accumulator = 0;
  let last = performance.now();
  let wasEnded = false;

  function frame(now) {
    let elapsed = (now - last) / 1000;
    last = now;
    if (elapsed > MAX_FRAME) elapsed = MAX_FRAME;
    accumulator += elapsed;

    const command = keyboard.readCommand();
    // screen transitions on the edges first
    if (command.pause && (world.state === STATE_RUNNING || world.state === STATE_PAUSED)) world.togglePause();
    if (command.confirm) {
      if (world.state === STATE_TITLE || world.state === STATE_CAUGHT || world.state === STATE_ESCAPED) {
        keyboard.clear();
        world.beginRun();
      }
    }

    let first = true;
    while (accumulator >= STEP_DT) {
      const stepCommand = first ? command : { ...command, jump: false };
      world.step(STEP_DT, stepCommand);
      first = false;
      accumulator -= STEP_DT;
    }

    const ended = world.state === STATE_CAUGHT || world.state === STATE_ESCAPED;
    if (ended && !wasEnded && world.score > world.best) {
      world.best = world.score;
      saveBest(world.best);
    }
    wasEnded = ended;

    world.draw(ctx);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shotName) runShot();
else runGame();
