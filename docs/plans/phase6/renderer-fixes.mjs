import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = process.env.TECHVIZ_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 0 } });
if (server) await server.listen();
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(process.env.TECHVIZ_URL || server.resolvedUrls.local[0]);
    await page.getByText('A* / Dijkstra', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Chuyển đến Bước 4' }).click();
    const stage = page.locator('.simulation-stage');
    if (!(await stage.innerText()).includes('Chưa có dữ liệu trọng số')) failures.push(`${width}: snapshot weight badge is misleading`);
    await stage.screenshot({ path: `docs/plans/phase6/grid-fix-${width}.png` });
    await page.getByRole('button', { name: 'Xóa tường', exact: true }).click();
    assert.ok((await stage.innerText()).includes('Trọng số f(n): BẬT'), 'interactive solver still exposes weights');
    await page.getByLabel('Chủ đề cần trực quan hóa').fill('Bubble pass [3,1,3]');
    await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
    const first = await page.getByText('[0]', { exact: true }).locator('../..').elementHandle();
    const duplicate = await page.getByText('[2]', { exact: true }).locator('../..').elementHandle();
    await page.getByRole('button', { name: 'Chuyển đến Bước 3' }).click();
    if (!await first.evaluate((element) => element.isConnected && element.textContent.includes('[1]'))) failures.push(`${width}: swapped value lost DOM identity`);
    assert.ok(await duplicate.evaluate((element) => element.isConnected), 'duplicate value retains a distinct element');
    await stage.screenshot({ path: `docs/plans/phase6/array-fix-${width}.png` });
    await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
    await page.getByRole('button', { name: 'Chạy tự động', exact: true }).click();
    const motion = await first.evaluate(async (element) => {
      const positions = [];
      const deadline = performance.now() + 7800;
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame);
        if (element.textContent.includes('[1]')) positions.push(element.getBoundingClientRect().x);
      }
      return { distance: Math.max(...positions) - Math.min(...positions), samples: positions.slice(0, 8) };
    });
    assert.ok(motion.distance > 1, `swapped element must move across animation frames: ${JSON.stringify(motion)}`);
    await stage.screenshot({ path: `docs/plans/phase6/array-moving-${width}.png` });
    await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
    const paused = await first.boundingBox();
    await page.waitForTimeout(250);
    assert.ok(Math.abs((await first.boundingBox()).x - paused.x) < 1, 'pause settles array layout within one pixel');
    await page.close();
  }
  assert.deepEqual(failures, []);
  console.log('PASS renderer fixes: desktop/mobile, duplicate identity, live grid weights, paused array; screenshots saved');
} finally {
  await browser.close();
  await server?.close();
}
