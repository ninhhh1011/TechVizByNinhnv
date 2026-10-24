import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(process.env.TECHVIZ_POC_URL || 'http://127.0.0.1:3000/docs/plans/phase2/poc.html');
    for (const id of ['A1', 'F1']) {
      await page.getByRole('button', { name: id }).click();
      for (const mode of ['Legacy renderer', 'Snapshot', 'Event + reducer']) {
        await page.getByRole('button', { name: mode, exact: true }).click();
        const values = [];
        for (let trial = 0; trial < 35; trial++) {
          const target = trial % 2 ? '0' : id === 'A1' ? '4' : '3';
          const elapsed = await page.evaluate(async (target) => {
            const slider = document.querySelector('input[aria-label="Seek frame"]');
            const frame = document.querySelector('[data-testid="frame"]');
            const before = frame.textContent;
            const start = performance.now();
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(slider, target);
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            while (frame.textContent === before) await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            return performance.now() - start;
          }, target);
          if (trial >= 5) values.push(elapsed);
        }
        values.sort((a, b) => a - b);
        const fps = await page.evaluate(() => new Promise((resolve) => {
          let first, count = 0;
          const tick = (now) => {
            if (first === undefined) first = now;
            if (++count < 61) requestAnimationFrame(tick);
            else resolve(+(60_000 / (now - first)).toFixed(1));
          };
          requestAnimationFrame(tick);
        }));
        results.push({ id, mode, viewport: `${viewport.width}x${viewport.height}`, p50Ms: +values[14].toFixed(2), p95Ms: +values[28].toFixed(2), maxMs: +values.at(-1).toFixed(2), domNodes: await page.locator('*').count(), idleRafFps: fps });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(process.env.TECHVIZ_MEASURE_OUTPUT || new URL('./measure-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.table(results);
