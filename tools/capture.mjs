// Screenshot driver for the local verify loop (run with node 22+ and NODE_PATH pointing at the
// shared Playwright install): boots the repo's own serve.ts on a spare port, opens each shot
// scene in headless Chromium at the game's native 1280x720, waits for the game to set
// window.__shotReady, photographs the canvas element, and checks the files (size, dimensions,
// distinct hashes). Usage:
//   NODE_PATH=/home/ubuntu/makefun/pw/node_modules node tools/capture.mjs [outfile.jpg ...]
// With no arguments it captures all four canonical shots into screenshots/.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // honours NODE_PATH, unlike a bare ESM import
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = [
  { name: '1-title.jpg', query: '?shot=title&seed=1' },
  { name: '2-run.jpg', query: '?shot=run&seed=1' },
  { name: '3-caught.jpg', query: '?shot=caught&seed=1' },
  { name: '4-escaped.jpg', query: '?shot=escaped&seed=1' },
];

const port = 8123;
const server = spawn(process.execPath, [join(repo, 'serve.ts'), '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('server did not come up')), 8000);
  server.stdout.on('data', (d) => { if (String(d).includes('http://')) { clearTimeout(timer); resolve(); } });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

const only = process.argv.slice(2);
const targets = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
mkdirSync(join(repo, 'screenshots'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const problems = [];
page.on('console', (msg) => { if (msg.type() === 'error') problems.push(msg.text()); });
page.on('pageerror', (err) => problems.push(String(err)));

const report = [];
for (const shot of targets) {
  await page.goto(`http://127.0.0.1:${port}/index.html${shot.query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__shotReady === true', null, { timeout: 30000 });
  const canvas = page.locator('#game');
  const outPath = join(repo, 'screenshots', shot.name);
  rmSync(outPath, { force: true });
  await canvas.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
  const bytes = readFileSync(outPath);
  const dims = await page.evaluate(async () => {
    const img = new Image();
    const c = document.getElementById('game');
    return { w: c.width, h: c.height };
  });
  report.push({
    name: shot.name,
    kb: Math.round(statSync(outPath).size / 1024),
    hash: createHash('sha256').update(bytes).digest('hex').slice(0, 16),
    canvas: `${dims.w}x${dims.h}`,
  });
}
await browser.close();
server.kill();

console.log(JSON.stringify({ report, consoleErrors: problems }, null, 2));
if (problems.length) process.exitCode = 2;
const hashes = new Set(report.map((r) => r.hash));
if (hashes.size !== report.length) { console.error('DISTINCT-HASH CHECK FAILED'); process.exitCode = 3; }
