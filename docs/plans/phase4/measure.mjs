import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir, cpus, platform, release } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from 'playwright';

const baseline = '991ea6c';
const root = process.cwd();
const output = await mkdtemp(join(tmpdir(), 'techviz-p4-measure-'));
const servers = [];
const rows = [];
let browser;
try {
  for (const mode of ['baseline', 'candidate']) {
    const outDir = join(output, mode);
    const plugins = mode === 'baseline' ? [{
      name: 'baseline-source', enforce: 'pre',
      load(id) {
        const path = id.replaceAll('\\', '/'), prefix = root.replaceAll('\\', '/') + '/src/';
        if (path.startsWith(prefix) && !path.includes('?')) return execFileSync('git', ['show', baseline + ':src/' + path.slice(prefix.length)], { encoding: 'utf8' });
      },
    }] : [];
    await build({ plugins, build: { outDir, emptyOutDir: true } });
    servers.push(await preview({ build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } }));
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const chip of ['Kafka', 'QuickSort', 'A* / Dijkstra', 'PSO / Swarm 2D', 'MergeSort (Tree)']) {
      const measures = [];
      for (const server of servers) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('http://127.0.0.1:' + server.httpServer.address().port + '/', { waitUntil: 'networkidle' });
        await page.getByText(chip, { exact: true }).first().click();
        const measurement = await page.evaluate(async () => {
          const values = [];
          for (let i = 0; i < 35; i++) {
            const step = i % 2 ? 1 : 2;
            const start = performance.now();
            document.querySelector('[aria-label="Chuyển đến Bước ' + step + '"]').click();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            if (!document.querySelector('main').innerText.match(new RegExp('Đang xem:\\s*Bước ' + step + '\\s*/'))) throw new Error('Frame not committed by rAF');
            if (i >= 5) values.push(performance.now() - start);
          }
          values.sort((a, b) => a - b);
          return { p50: values[14], p95: values[28], max: values[29], samples: values, domNodes: document.querySelectorAll('*').length, heapBytes: performance.memory?.usedJSHeapSize ?? null };
        });
        assert.deepEqual(errors, []);
        measures.push(measurement);
        await page.close();
      }
      const ratio = measures[1].p95 / measures[0].p95;
      rows.push({ viewport, chip, baseline: measures[0], candidate: measures[1], p95Ratio: ratio, pass: ratio <= 1.25 && measures[1].max <= 100 });
      console.log(viewport.width + ' ' + chip + ': p95 ratio ' + ratio.toFixed(3) + ', max ' + measures[1].max.toFixed(1) + 'ms');
    }
  }
  await writeFile(new URL('./measure-results.json', import.meta.url), JSON.stringify({
    date: '2026-10-22', baseline, browser: browser.version(), hardware: { os: platform() + ' ' + release(), cpu: cpus()[0]?.model, logicalCores: cpus().length },
    method: 'Production builds, same machine, 5 warmups + 30 alternating seeks between frames 1/2. Click to committed frame on next rAF. Heap is an optional browser diagnostic; no claim of retained memory or animation FPS. Correctness is checked separately.',
    rows,
  }, null, 2) + '\n');
  assert.ok(rows.every((row) => row.pass), 'Performance threshold exceeded; inspect measure-results.json');
} finally {
  if (browser) await browser.close();
  for (const server of servers) {
    server.httpServer.closeAllConnections();
    await new Promise((done) => server.httpServer.close(done));
  }
  if (dirname(resolve(output)) !== resolve(tmpdir()) || !basename(output).startsWith('techviz-p4-measure-')) throw new Error('Unexpected temporary path');
  await rm(output, { recursive: true, force: true });
}
