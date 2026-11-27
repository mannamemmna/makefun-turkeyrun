// Dev probe (Node, not shipped in game/): imports the game's own pure-JS modules and runs the
// screenshot autopilot for many seeds, printing how the canonical frames come out (state, lives
// left, yards, score) so we can pick the seed where the hero shots show a healthy, mid-stride
// turkey. Usage: node tools/probe.mjs
import { createRng, hashSeed } from '../game/src/rng.js';
import { GameWorld, STATE_RUNNING } from '../game/src/world.js';
import { autopilotCommand } from '../game/src/shots.js';
import { STEP_DT } from '../game/src/config.js';

const RUN_SECONDS = 12;
const WARM_SECONDS = 10;

for (let seed = 1; seed <= 24; seed += 1) {
  function run(seconds) {
    const w = new GameWorld(createRng(hashSeed(seed)));
    w.beginRun();
    const steps = Math.round(seconds / STEP_DT);
    for (let i = 0; i < steps && w.state === STATE_RUNNING; i += 1) w.step(STEP_DT, autopilotCommand(w, true));
    return w;
  }
  const a = run(RUN_SECONDS);
  const b = run(WARM_SECONDS);
  console.log(
    `seed ${String(seed).padStart(2)}  run12s: ${a.state} lives=${a.lives} yd=${Math.floor(a.yards)} score=${a.score}` +
      `  | warm10s: ${b.state} lives=${b.lives} yd=${Math.floor(b.yards)}`,
  );
}
