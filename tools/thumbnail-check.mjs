// Thumbnail audit for the four canonical shots (run with node 22+ and NODE_PATH at the shared
// Playwright install). For each shot it: (1) loads the staged scene and reads the hero boxes —
// subject, banner text block, threat/hazard — from the LIVE staged world (run) or the screens'
// fixed layout constants (plates), (2) rasterizes their union and asserts combined coverage
// > 25% of the 1280x720 frame, (3) asserts the block's lead text has >= 28px cap-height at full
// res, and (4) writes a true 384x216 downscale of the captured JPEG for eyeballing. Usage:
//   NODE_PATH=/home/ubuntu/makefun/pw/node_modules node tools/thumbnail-check.mjs

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRAME_AREA = 1280 * 720;
const MIN_COVERAGE = 0.25;
const CAP_RATIO = 0.72; // bold sans cap-height ≈ 0.72 of font size

// [x0, y0, x1, y1] hero boxes per frame, plus the lead text size of the banner block.
// run-frame boxes are recomputed from the live staged world below.
const PLATE_HEROES = {
  '1-title.jpg': {
    boxes: [
      [810, 225, 1213, 629], // hero turkey portrait (screens.js: translate 1030, scale 3.15)
      [282, 85, 1038, 210], // TURKEY RUN lettering
      [-22, 144, 255, 598], // farmer with raised pitchfork
      [250, 300, 430, 460], // glinting carving knife in flight
    ],
    leadTextPx: 122,
  },
  '3-caught.jpg': {
    boxes: [
      [390, 170, 890, 530], // the oven, roast inside — subject and gag together
      [400, 35, 880, 160], // CAUGHT! banner + subtitle
      [390, 545, 890, 715], // stats + restart prompt
    ],
    leadTextPx: 96,
  },
  '4-escaped.jpg': {
    boxes: [
      [524, 290, 756, 535], // leaping hero turkey
      [170, 90, 1110, 240], // FREE AT LAST! ribbon + subtitle
      [1015, 288, 1180, 550], // the furious farmer at the fence
      [390, 530, 890, 700], // stats + restart prompt
    ],
    leadTextPx: 74,
  },
};

function unionCoverage(boxes) {
  const CELL = 4;
  const cols = 1280 / CELL;
  const rows = 720 / CELL;
  const grid = new Uint8Array(cols * rows);
  for (const [x0, y0, x1, y1] of boxes) {
    for (let gy = Math.max(0, Math.floor(y0 / CELL)); gy < Math.min(rows, Math.ceil(y1 / CELL)); gy += 1) {
      for (let gx = Math.max(0, Math.floor(x0 / CELL)); gx < Math.min(cols, Math.ceil(x1 / CELL)); gx += 1) {
        grid[gy * cols + gx] = 1;
      }
    }
  }
  let cells = 0;
  for (const v of grid) cells += v;
  return (cells * CELL * CELL) / FRAME_AREA;
}

const port = 8126;
const server = spawn(process.execPath, [join(repo, 'serve.ts'), '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('server did not come up')), 8000);
  server.stdout.on('data', (d) => { if (String(d).includes('http://')) { clearTimeout(timer); resolve(); } });
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const outDir = join(repo, '.thumb');
mkdirSync(outDir, { recursive: true });

const results = [];
for (const [file, query] of [
  ['1-title.jpg', '?shot=title&seed=1'],
  ['2-run.jpg', '?shot=run&seed=1'],
  ['3-caught.jpg', '?shot=caught&seed=1'],
  ['4-escaped.jpg', '?shot=escaped&seed=1'],
]) {
  await page.goto(`http://127.0.0.1:${port}/index.html${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });

  let heroes;
  if (file === '2-run.jpg') {
    // boxes straight from the staged world: turkey, the bale under it, the farmer, the HUD block
    heroes = await page.evaluate(() => {
      const w = window.__shotWorld;
      const t = w.turkey;
      const bale = w.hazards.items.find((it) => it.kind === 'bale' && it.x > t.x - 80 && it.x < t.x + 80);
      const fx = w.farmer.onScreen;
      const GROUND_Y = 592;
      return {
        boxes: [
          [t.x - 32, t.y - 114, t.x + 32, t.y + 10], // airborne turkey + wing spread
          bale ? [bale.x - 42, bale.y - 6, bale.x + 42, GROUND_Y + 6] : [0, 0, 0, 0], // the bale under it
          [fx - 105, GROUND_Y - 460, fx + 165, GROUND_Y + 8], // the chasing farmer
          [28, 26, 1252, 172], // HUD block: hearts, score, rail, zone label
        ],
        leadTextPx: 40, // the score readout, HUD's lead line at full res
      };
    });
  } else {
    heroes = PLATE_HEROES[file];
  }

  const coverage = unionCoverage(heroes.boxes);
  const capPx = heroes.leadTextPx * CAP_RATIO;

  // true downscale of the captured JPEG to 384x216, saved for eyeballing
  const jpg = readFileSync(join(repo, 'screenshots', file));
  const dataUrl = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  const png = await page.evaluate(async (src) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
    const c = document.createElement('canvas');
    c.width = 384; c.height = 216;
    c.getContext('2d').drawImage(img, 0, 0, 384, 216);
    return c.toDataURL('image/png');
  }, dataUrl);
  const thumbPath = join(outDir, file.replace('.jpg', '-384x216.png'));
  const buf = Buffer.from(png.split(',')[1], 'base64');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(thumbPath, buf);

  results.push({
    file,
    heroBoxes: heroes.boxes.length,
    coveragePct: Math.round(coverage * 1000) / 10,
    coverageOK: coverage > MIN_COVERAGE,
    leadCapPx: Math.round(capPx),
    capOK: capPx >= 28,
    thumb: thumbPath,
  });
}
await browser.close();
server.kill();

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.coverageOK || !r.capOK);
if (failed.length) {
  console.error(`THUMBNAIL AUDIT FAILED: ${failed.map((f) => f.file).join(', ')}`);
  process.exitCode = 4;
} else {
  console.log('THUMBNAIL AUDIT PASSED (all four frames)');
}
