// The screenshot scenes behind ?shot=title|run|caught|escaped&seed=N. Each drives the REAL world
// forward in fixed steps from a seeded rng, steered by the autopilot below, so every frozen frame
// is genuine gameplay footage and the same seed always reproduces the same frame. The caught
// scene banks distance first and then runs blind (a hurried player's end); the escaped scene warps
// to the last stretch of kitchen, the way a near-finish feels, and crosses the line for real.

import { ESCAPE_YARDS, FAST_FALL_VELOCITY, GRAVITY, GROUND_Y, JUMP_VELOCITY, PX_PER_YARD, STEP_DT, speedAtYards } from './config.js';
import { DUCK_HEIGHT, STAND_HEIGHT } from './turkey.js';
import { KIND_HUNG, KIND_THROWN } from './hazards.js';
import { STATE_RUNNING } from './world.js';

const TITLE_SECONDS = 4;
const RUN_SECONDS = 10; // farmyard proper (≈370 yd), before the zone crossfade begins
const ESCAPE_WARMUP_SECONDS = 10;
const LIMIT_SECONDS = 240;
const ESCAPE_WARP_TO = ESCAPE_YARDS - 25;
const COMFORT_X = 330;

/**
 * One autopilot step, by policy search: try holding a run, holding a duck, and jumping at each of
 * several delays; for every policy simulate the turkey's exact vertical motion against the
 * hazards' straight-line drift and find when it first crashes. Play the policy that survives
 * longest, preferring the plain run on ties, and drift back to the comfortable middle of the
 * screen. `evasive` false makes the turkey ignore everything — it just runs into its dinner.
 */
export function autopilotCommand(world, evasive) {
  const cmd = { slide: 0, duck: false, jump: false, confirm: false, pause: false };
  if (!evasive) return cmd;
  const turkey = world.turkey;
  const scrollSpeed = speedAtYards(world.yards);
  cmd.slide = Math.abs(turkey.x - COMFORT_X) > 24 ? Math.sign(COMFORT_X - turkey.x) : 0;

  const policies = [{ jumpAt: Infinity, duck: false }, { jumpAt: Infinity, duck: true }];
  for (const d of JUMP_DELAYS) policies.push({ jumpAt: d, duck: false });
  let best = policies[0];
  let bestSurvive = -1;
  for (const policy of policies) {
    const s = policySurvival(world, policy, scrollSpeed);
    if (s > bestSurvive + 1e-6) {
      bestSurvive = s;
      best = policy;
    }
  }
  cmd.jump = best.jumpAt === 0;
  cmd.duck = best.duck;
  return cmd;
}

const JUMP_DELAYS = [0, 0.1, 0.2, 0.3, 0.4, 0.55, 0.7];

/**
 * Seconds until the given {jumpAt, duck} policy first puts the turkey inside a hazard; Infinity
 * if the whole horizon is clear. Mirrors Turkey.update's motion exactly: launch, gravity, landing
 * clamp, and the duck's fast-fall and height change.
 */
function policySurvival(world, policy, scrollSpeed) {
  const HORIZON = 1.6;
  const t0 = world.turkey;
  let y = t0.y;
  let vy = t0.onGround ? 0 : t0.vy;
  let onGround = t0.onGround;
  let duck = t0.duck;
  for (let step = 0; step * STEP_DT <= HORIZON; step += 1) {
    const t = step * STEP_DT;
    // test this instant first
    const height = STAND_HEIGHT - (STAND_HEIGHT - DUCK_HEIGHT) * duck;
    const box = { x0: t0.x - 24, x1: t0.x + 24, y0: y - height + 8, y1: y };
    for (const item of world.hazards.items) {
      const b = world.hazards.boxOf(item, world.timeSecs);
      const dx = item.kind === KIND_THROWN ? item.vx * t : -scrollSpeed * t;
      const pad = item.kind === KIND_HUNG ? 7 : 0; // cover the rope's sway
      if (box.x1 > b.x0 + dx - pad && box.x0 < b.x1 + dx + pad && box.y1 > b.y0 && box.y0 < b.y1) return t;
    }
    // advance the turkey one step under the policy
    if (onGround && policy.jumpAt <= t + STEP_DT / 2) {
      vy = JUMP_VELOCITY;
      onGround = false;
    }
    duck += ((policy.duck ? 1 : 0) - duck) * Math.min(1, STEP_DT * 14);
    if (!onGround) {
      if (policy.duck) vy += FAST_FALL_VELOCITY * STEP_DT * 2.2;
      vy += GRAVITY * STEP_DT;
      y += vy * STEP_DT;
      if (y >= GROUND_Y) {
        y = GROUND_Y;
        vy = 0;
        onGround = true;
      }
    }
  }
  return Infinity;
}

/** Step the running world forward up to `seconds`, or until it ends; returns seconds actually run. */
function simulate(world, seconds, evasive) {
  const steps = Math.round(seconds / STEP_DT);
  let i = 0;
  for (; i < steps && world.state === STATE_RUNNING; i += 1) {
    world.step(STEP_DT, autopilotCommand(world, evasive));
  }
  return i * STEP_DT;
}

/**
 * Stage the named scene on `world` (constructed with the run's seeded rng, untouched so far).
 * Any other name stages the title. After this returns, the world holds the canonical frame.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'run') {
    world.beginRun();
    simulate(world, RUN_SECONDS, true);
    stageRunComposition(world);
  } else if (name === 'caught') {
    world.beginRun();
    simulate(world, ESCAPE_WARMUP_SECONDS, true); // bank a respectable score first
    simulate(world, LIMIT_SECONDS, false); // then stop dodging until the farmer lands him
  } else if (name === 'escaped') {
    world.beginRun();
    simulate(world, ESCAPE_WARMUP_SECONDS, true);
    warpNearFinish(world);
    simulate(world, LIMIT_SECONDS, true);
  } else {
    simulate(world, TITLE_SECONDS, false); // title drift only
  }
  return world;
}

/**
 * Make the frozen run frame read at a glance: the farmer visibly close, a carving knife in the
 * air beside the turkey, corn on the jump line. Only fills gaps the simulation left open.
 */
function stageRunComposition(world) {
  const turkey = world.turkey;
  if (world.farmer.closeness < 0.5) world.farmer.closeness = 0.5;
  const onScreen = world.hazards.items.filter((it) => it.x > -40 && it.x < 1280);
  if (!onScreen.some((it) => it.kind === KIND_THROWN)) {
    world.hazards.spawn(KIND_THROWN, turkey.x + 250, { high: true, vx: 0 });
  }
  // hung blades are a barn/kitchen menace — no rafters in the open farmyard
  if (world.yards >= 500 && !onScreen.some((it) => it.kind === KIND_HUNG)) {
    world.hazards.spawn(KIND_HUNG, turkey.x + 470);
  }
  if (world.corn.cobs.length === 0) {
    for (let i = 0; i < 4; i += 1) {
      world.corn.cobs.push({ x: turkey.x + 130 + i * 74, y: GROUND_Y - 235 - Math.sin((i / 3) * Math.PI) * 45, bobPhase: i, eaten: false });
    }
  }
}

/** Jump the run to the last 25 yards of kitchen and clear the road for the final sprint. */
function warpNearFinish(world) {
  world.yards = ESCAPE_WARP_TO;
  world.scrollPx = world.yards * PX_PER_YARD;
  world.hazards.items = [];
  world.hazards.nextSpawnYards = world.yards + 40;
  world.corn.reset(world.rng);
}
