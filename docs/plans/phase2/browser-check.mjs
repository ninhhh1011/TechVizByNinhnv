import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch();
await mkdir(new URL('./screenshots/', import.meta.url), { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.TECHVIZ_POC_URL || 'http://127.0.0.1:3000/docs/plans/phase2/poc.html');
    for (const id of ['A1', 'F1']) {
      await page.getByRole('button', { name: id }).click();
      for (const mode of ['Legacy renderer', 'Snapshot', 'Event + reducer']) {
        await page.getByRole('button', { name: mode, exact: true }).click();
        await page.getByRole('slider', { name: 'Seek frame' }).fill(id === 'A1' ? '4' : '3');
        assert.match(await page.locator('[data-testid="frame"]').innerText(), id === 'A1' ? /1, 2, 3/ : /r2.*b/);
        await page.getByRole('button', { name: 'Play' }).click();
        await page.getByRole('button', { name: 'Pause' }).click();
        const paused = await page.locator('[data-testid="frame"]').innerText();
        await page.waitForTimeout(600);
        assert.equal(await page.locator('[data-testid="frame"]').innerText(), paused);
        if (mode !== 'Snapshot') await page.screenshot({ path: fileURLToPath(new URL(`./screenshots/${viewport.width}-${id}-${mode === 'Legacy renderer' ? 'legacy' : 'reducer'}.png`, import.meta.url)), animations: 'disabled', fullPage: true });
        if (mode === 'Legacy renderer') continue;
        assert.equal(await page.locator('svg [data-event]').count() > 0, true, `${id}: visual event missing`);
        if (id === 'A1') {
          await page.getByRole('slider', { name: 'Seek frame' }).fill('1');
          assert.equal(await page.locator('svg [data-event="compare"]').count() > 0, true, 'compare not shown');
        }
        const labels = await page.locator('svg text').evaluateAll((nodes) => nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        }));
        const svg = await page.locator('svg').boundingBox();
        assert.ok(svg);
        for (const label of labels) assert.ok(label.left >= svg.x - 1 && label.right <= svg.x + svg.width + 1, `${id}: clipped label`);
        for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i], b = labels[j];
          assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, `${id}: overlapping labels`);
        }
      }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal document overflow');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('P2 browser: A1/F1 × legacy/snapshot/reducer × desktop/mobile pass');
} finally {
  await browser.close();
}
