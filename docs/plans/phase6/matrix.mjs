import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const rows = [];
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch({ headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      for (const [family, chip] of [['flow', 'Kafka'], ['array', 'QuickSort'], ['grid', 'A* / Dijkstra'], ['swarm', 'PSO / Swarm 2D'], ['tree', 'MergeSort (Tree)']]) {
        const preset = page.getByRole('button', { name: chip, exact: true });
        await preset.focus();
        await page.keyboard.press('Enter');
        assert.equal(await preset.getAttribute('aria-pressed'), 'true');
        await page.keyboard.press('ArrowRight');
        assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 2\s*\//);
        await page.keyboard.press('ArrowLeft');
        assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 1\s*\//);
        assert.equal(await page.locator('.simulation-stage').getAttribute('data-playing'), 'false');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, engine + ' ' + family);
        assert.equal(await page.locator('main [aria-current="step"]').count(), 1);
        assert.deepEqual(errors, []);
        if (engine === 'chromium') {
          await page.screenshot({ path: fileURLToPath(new URL(viewport.width + '-' + family + '.png', output)), fullPage: true, animations: 'disabled' });
          await writeFile(new URL(viewport.width + '-' + family + '.aria.txt', output), await page.locator('main').ariaSnapshot());
        }
        rows.push({ engine, version: browser.version(), viewport, family, verdict: 'pass' });
        console.log('PASS ' + engine + ' ' + viewport.width + ' ' + family + ': keyboard, reduced motion, timeline, no document overflow/errors');
      }
      await page.close();
    }
  } finally { await browser.close(); }
}
await writeFile(new URL('./matrix-results.json', import.meta.url), JSON.stringify({ date: '2026-10-22', rows, limit: 'Automated browser and accessibility-tree checks; no human screen-reader or learner verdict.' }, null, 2) + '\n');
