import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const golden = JSON.parse(readFileSync(new URL('./preset-golden.json', import.meta.url)));
const chips = {
  'apache-kafka': 'Kafka', 'redis-cache': 'Redis Cache', 'rag-pipeline': 'RAG Pipeline',
  'quick-sort': 'QuickSort', 'binary-search': 'Binary Search', 'astar-dijkstra-grid': 'A* / Dijkstra',
  'genetic-algorithm-ga': 'PSO / Swarm 2D', 'merge-sort': 'MergeSort (Tree)',
  'bubble-sort': 'BubbleSort', 'load-balancer': 'Load Balancer', 'token-bucket': 'Rate Limiter',
};
const browser = await chromium.launch({ headless: true });
const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
try {
  for (const [viewport, size] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
    const page = await browser.newPage({ viewport: size });
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    for (const preset of golden) {
      await page.getByText(chips[preset.id], { exact: true }).first().click();
      const main = page.locator('main');
      await main.getByText(preset.stepTitles[0], { exact: true }).first().waitFor();
      assert.match(await main.innerText(), new RegExp(`Đang xem:\\s*Bước 1\\s*/\\s*${preset.steps}`), preset.id);
      for (let index = 0; index < preset.steps; index++) {
        if (index) await page.getByRole('button', { name: `Chuyển đến Bước ${index + 1}` }).click();
        await main.getByText(preset.stepTitles[index], { exact: true }).first().waitFor();
        await main.getByText(preset.stepExplanations[index], { exact: true }).first().waitFor();
        for (const label of preset.packetLabels[index]) {
          assert.ok(await main.getByText(label, { exact: true }).count(), `${preset.id} step ${index + 1}: packet ${label} missing`);
        }
      }
      await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
      assert.equal(errors.length, 0, `${preset.id}: ${errors.join('; ')}`);
      console.log(`PASS ${viewport} ${preset.id}: ${preset.steps} steps, packet labels, reset`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
