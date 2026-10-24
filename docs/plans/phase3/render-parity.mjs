import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from 'playwright';

// Compare renderer output with the pre-P3 Git revision, not a golden derived from today's source.
const baseline = '991ea6c';
const root = process.cwd();
const golden = JSON.parse(readFileSync(new URL('./preset-golden.json', import.meta.url)));
const chips = ['Kafka', 'Redis Cache', 'RAG Pipeline', 'QuickSort', 'Binary Search', 'MergeSort (Tree)', 'BubbleSort', 'A* / Dijkstra', 'PSO / Swarm 2D', 'Load Balancer', 'Rate Limiter'];
const output = await mkdtemp(join(tmpdir(), 'techviz-parity-'));
const servers = [];
let browser;
const rows = [];
try {
  for (const name of ['baseline', 'candidate']) {
    const outDir = join(output, name);
    const plugins = name === 'baseline' ? [{
      name: 'pre-p3-source', enforce: 'pre',
      load(id) {
        const path = id.replaceAll('\\', '/');
        const prefix = `${root.replaceAll('\\', '/')}/src/`;
        if (path.startsWith(prefix) && !path.includes('?')) {
          return execFileSync('git', ['show', `${baseline}:src/${path.slice(prefix.length)}`], { encoding: 'utf8' });
        }
      },
    }] : [];
    await build({ plugins, build: { outDir, emptyOutDir: true } });
    servers.push(await preview({ build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } }));
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const pages = [];
    for (const server of servers) {
      const page = await browser.newPage({ viewport });
      await page.clock.install({ time: new Date('2026-10-22T00:00:00Z') });
      await page.clock.pauseAt(new Date('2026-10-22T00:00:01Z'));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`, { waitUntil: 'load' });
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      await page.clock.runFor(2000);
      pages.push(page);
    }
    for (const [presetIndex, preset] of golden.entries()) {
      for (const page of pages) {
        await page.getByText(chips[presetIndex], { exact: true }).first().click();
        await page.clock.runFor(2000);
      }
      for (let step = 0; step < preset.steps; step++) {
        const states = [];
        for (const page of pages) {
          if (step) await page.getByRole('button', { name: `Chuyển đến Bước ${step + 1}` }).click();
          await page.clock.runFor(2000);
          const stage = page.locator('main > div').nth(1);
          states.push(await stage.evaluate((element) => {
            for (const svg of element.querySelectorAll('svg')) {
              svg.pauseAnimations?.();
              svg.setCurrentTime?.(0);
            }
            const copy = element.cloneNode(true);
            for (const animated of copy.querySelectorAll('[style]')) {
              // Endless Framer motion has no final frame; compare state/layout, not its sampling phase.
              animated.style.removeProperty('opacity');
              const transform = animated.style.transform;
              if (transform && !transform.includes('rotate(') && !transform.includes('translate(0px, 0px)')) animated.style.removeProperty('transform');
              if (!animated.getAttribute('style')) animated.removeAttribute('style');
            }
            return copy.innerHTML;
          }));
        }
        const mismatch = [...states[0]].findIndex((value, index) => value !== states[1][index]);
        assert.ok(states[1] === states[0], `${viewport.width} ${preset.id} step ${step + 1}: renderer DOM differs at ${mismatch}\nbaseline: ${states[0].slice(Math.max(0, mismatch - 60), mismatch + 160)}\ncandidate: ${states[1].slice(Math.max(0, mismatch - 60), mismatch + 160)}`);
      }
      rows.push({ viewport, preset: preset.id, steps: preset.steps, verdict: 'pass' });
      console.log(`PASS ${viewport.width} ${preset.id}: ${preset.steps} renderer frames match ${baseline}`);
    }
    for (const page of pages) await page.close();
  }
  await writeFile(new URL('./render-parity-results.json', import.meta.url), `${JSON.stringify({ baseline, browser: browser.version(), comparison: 'Stage DOM including text, classes, SVG paths, packet count/labels and inline left/top/size. CSS motion disabled; transient Framer opacity/translation/scale excluded. Vector rotation and canvas transform retained. This compares semantic frame/layout, not animation phase or pixels. Banner/header excluded because copy intentionally changed.', rows }, null, 2)}\n`);
} finally {
  if (browser) await browser.close();
  for (const server of servers) {
    server.httpServer.closeAllConnections();
    await new Promise((done) => server.httpServer.close(done));
  }
  if (dirname(resolve(output)) !== resolve(tmpdir()) || !basename(output).startsWith('techviz-parity-')) throw new Error('Unexpected temporary build path');
  await rm(output, { recursive: true, force: true });
}
