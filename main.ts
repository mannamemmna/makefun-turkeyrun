// Turkey Run: Escape from Thanksgiving — make.fun entry for turkey-run-game-01 (Node 22+, standard
// library only). The game lives in ./game as plain static files (game/index.html plus its ES
// modules under src/, no library, no network request, opens offline in desktop Chrome). This
// program hands the entry in: it copies game/ and screenshots/ to $MAKEFUN_OUTPUT_DIR (the grader
// uses /output) and writes dossier.json there with buildDossier from ./vendor/makefun-game.ts, the
// kit's unchanged copy of the library the sealed scorer rebuilds the dossier from.
//
// Locally: `node serve.ts` serves game/ on http://localhost:8080; screenshots are captured by the
// tools/capture.mjs Playwright driver against ?shot=title|run|caught|escaped&seed=1.
//
//   mkdir -p /tmp/tk-out && MAKEFUN_OUTPUT_DIR=/tmp/tk-out node --experimental-strip-types main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Preflight: refuse to hand in an entry the scorer would reject — a missing index.html, or a
// shot image over 256 KiB (the scorer's per-screenshot cap) — instead of shipping a dossier
// that documents a doomed entry.
const gameIndex = join(out, 'game', 'index.html');
if (!existsSync(gameIndex)) throw new Error(`missing ${gameIndex}`);
for (const name of ['1-title.jpg', '2-run.jpg', '3-caught.jpg', '4-escaped.jpg']) {
  const shot = join(out, 'screenshots', name);
  if (!existsSync(shot)) throw new Error(`missing screenshot ${shot}`);
  if (statSync(shot).size > 262144) throw new Error(`screenshot over 256 KiB: ${shot}`);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse — more than 4 screenshots or one over 256 KiB, more
// than 993 entries or 48 MiB under game/, or any path under game/ over 1,000 UTF-8 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`entry written to ${out}`);
