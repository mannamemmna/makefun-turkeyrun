# Turkey Run: Escape from Thanksgiving

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/mannamemmna/makefun-turkeyrun/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/mannamemmna/makefun-turkeyrun/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A side-scrolling endless-runner bounty entry: one turkey, 1,500 yards, one very determined farmer,
and a kitchen that is already preheated. Dodge hay bales, ceiling-hung carving knives and the
farmer's thrown blades, grab corn on the run, and reach the barn door before the farmer's fork
does — or end up garnished.

Play it in any desktop Chrome, fully offline: open `game/index.html`.

## Controls

| Key | Action |
| --- | --- |
| ↑ / W | Jump (hold Space mid-air for a fast fall) |
| ↓ / S | Duck under hung blades and thrown knives |
| ← → / A D | Slide along the safe lane |
| Space / Enter | Start run · restart after caught/escaped |
| P | Pause |

Three hearts, distance-plus-corn scoring, a best score kept in `localStorage`, and difficulty that
ramps with every yard: tighter gaps, faster scroll, and zone recipes that escalate from farmyard
bales to barn rafters full of knives to the kitchen oven line.

## Layout

```
game/               the playable entry — static files only, no libraries, no network
  index.html        canvas shell (1280x720, opens offline)
  src/
    config.js       every tunable constant in one place
    rng.js          seeded mulberry32 — deterministic worlds for shot mode
    input.js        keyboard edge detection and command shaping
    art.js          the house drawing vocabulary: chunky outlines, palettes, text
    parallax.js     layered farm/barn/kitchen backdrops
    turkey.js       player physics, flap/leg animation, panic face
    farmer.js       the pursuer: stride, lunge, pitchfork, silhouette
    hazards.js      bales, hung knives, thrown blades, oven mouths — spawn + collide + draw
    pickups.js      corn arcs
    particles.js    feathers, dust, sparkles, confetti
    hud.js          hearts, score, zone label, progress rail to freedom
    screens.js      title plate, caught (oven gag), escaped (freedom banner)
    audio.js        optional WebAudio blips, gated behind the first gesture
    world.js        state machine and fixed-step integrator
    shots.js        ?shot= staging: real simulated frames, not hand-placed demos
    main.js         boot, loop, window.__shotReady signalling
screenshots/        the four canonical frames (cover first)
vendor/makefun-game.ts   kit library, unchanged — builds the dossier
main.ts             entry program: copies game/ + screenshots/ to $MAKEFUN_OUTPUT_DIR,
                    writes dossier.json via buildDossier
serve.ts            local dev server for game/ (kit-provided, unchanged)
tools/              dev-only Playwright drivers (capture.mjs, probe.mjs) — not shipped
```

## Reproducing

```sh
node serve.ts                        # serve game/ on localhost:8080
NODE_PATH=<playwright> node tools/capture.mjs   # deterministic shots via ?shot=&seed=1
mkdir -p /tmp/tk-out
MAKEFUN_OUTPUT_DIR=/tmp/tk-out node main.ts     # emits game/, screenshots/, dossier.json
```

License: MIT.
