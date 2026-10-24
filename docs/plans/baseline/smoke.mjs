import { chromium } from 'playwright';
import { copyFile, mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const output = process.env.TECHVIZ_SMOKE_OUTPUT || fileURLToPath(new URL('./', import.meta.url));
const runOutput = await mkdtemp(join(tmpdir(), 'techviz-smoke-'));
const screenshots = join(runOutput, 'screenshots');
const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
const cases = [
  ['flow-graph', 'Kafka', 'SƠ ĐỒ TRỰC QUAN HỆ THỐNG'],
  ['array-pointer', 'QuickSort', 'TRỰC QUAN HÓA MẢNG'],
  ['grid-path', 'A* / Dijkstra', 'Grid Path Stage'],
  ['swarm-2d', 'PSO / Swarm 2D', 'Swarm 2D Stage'],
  ['tree-graph', 'MergeSort (Tree)', 'Tree & Hierarchy Stage'],
];

function step(text) {
  const match = text.match(/Đang xem:\s*Bước\s*(\d+)\s*\/\s*(\d+)/);
  if (!match) throw new Error('Playback step label missing');
  return [Number(match[1]), Number(match[2])];
}

const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir(screenshots);

for (const [device, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
  for (const [family, chip, stage] of cases) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const result = { device, family, preset: chip, checks: [], errors };
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.getByText(chip, { exact: true }).first().click();
      await page.getByText(stage, { exact: false }).first().waitFor();
      result.checks.push('renderer');
      const main = page.locator('main');
      if (step(await main.innerText())[0] !== 1) throw new Error('Initial step is not 1');
      await page.screenshot({ path: join(screenshots, `${device}-${family}.png`), fullPage: true, animations: 'disabled' });

      await page.getByRole('button', { name: 'Bước tiếp theo' }).click();
      if (step(await main.innerText())[0] !== 2) throw new Error('Next did not reach step 2');
      await page.getByRole('button', { name: 'Bước trước' }).click();
      if (step(await main.innerText())[0] !== 1) throw new Error('Previous did not return to step 1');
      await page.getByRole('button', { name: 'Chuyển đến Bước 3' }).click();
      if (step(await main.innerText())[0] !== 3) throw new Error('Seek did not reach step 3');
      await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
      if (step(await main.innerText())[0] !== 1) throw new Error('Reset did not reach step 1');
      result.checks.push('next/previous/seek/reset');

      await page.getByRole('button', { name: '2x' }).click();
      await page.getByRole('button', { name: 'Chạy tự động' }).click();
      await page.getByRole('button', { name: 'Tạm dừng' }).waitFor();
      await page.waitForFunction(() => /Đang xem:\s*Bước\s*[2-9]/.test(document.querySelector('main')?.innerText || ''), null, { timeout: 5000 });
      await page.getByRole('button', { name: 'Tạm dừng' }).click();
      const paused = step(await main.innerText())[0];
      await page.waitForTimeout(1900);
      if (step(await main.innerText())[0] !== paused) throw new Error('Step advanced while paused');
      result.checks.push('autoplay/pause/speed');

      await page.getByRole('button', { name: 'Phóng to (+)' }).click();
      await page.getByRole('button', { name: '115%' }).waitFor();
      await page.getByRole('button', { name: 'Bật kéo khung vẽ (Pan)' }).click();
      const panSurface = page.locator('div.cursor-grab').first();
      await panSurface.scrollIntoViewIfNeeded();
      const stageBox = await panSurface.boundingBox();
      if (!stageBox) throw new Error('Pan surface bounding box missing');
      const x = stageBox.x + 20;
      const y = Math.max(100, Math.min(viewport.height - 100, stageBox.y + stageBox.height / 2));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 35, y + 20, { steps: 5 });
      await page.mouse.up();
      const transform = await page.locator('div[style*="transform: translate("][style*="scale("]').first().getAttribute('style');
      if (!transform || transform.includes('translate(0px, 0px)')) throw new Error('Pan transform stayed at origin');
      await page.getByRole('button', { name: 'Đặt lại khung nhìn (1:1)' }).click();
      result.checks.push('zoom/pan/reset-view');

      result.frameMs = await page.evaluate(() => new Promise((resolve) => {
        const values = [];
        let previous;
        const tick = (now) => {
          if (previous !== undefined) values.push(now - previous);
          previous = now;
          if (values.length < 60) requestAnimationFrame(tick);
          else {
            values.sort((a, b) => a - b);
            resolve({ median: Number(values[29].toFixed(1)), p95: Number(values[56].toFixed(1)), over50ms: values.filter((v) => v > 50).length });
          }
        };
        requestAnimationFrame(tick);
      }));
      result.domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
      result.horizontalOverflowPx = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
      if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);
      result.status = 'pass';
    } catch (error) {
      result.status = 'fail';
      result.failure = String(error.message || error);
      await page.screenshot({ path: join(screenshots, `${device}-${family}-failure.png`), fullPage: true }).catch(() => {});
    } finally {
      results.push(result);
      await page.close();
    }
  }
}

const page = await browser.newPage();
const ai = { device: 'desktop', family: 'ai-error', checks: [] };
try {
  await page.route('**/api/groq', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"baseline simulated outage"}' }));
  await page.route('https://api.groq.com/**', (route) => route.abort());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/Nhập thuật toán/).fill('techviz-unknown-topic-baseline');
  await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
  await page.getByText('Chưa thể mô phỏng chủ đề này').waitFor({ timeout: 10000 });
  ai.checks.push('mocked-503-error-card');
  ai.status = 'pass';
  await page.screenshot({ path: join(screenshots, 'ai-error.png'), fullPage: true, animations: 'disabled' });
} catch (error) {
  ai.status = 'fail';
  ai.failure = String(error.message || error);
  await page.screenshot({ path: join(screenshots, 'ai-error-failure.png'), fullPage: true }).catch(() => {});
} finally {
  results.push(ai);
  await page.close();
  await browser.close();
}

const report = JSON.stringify({ baseUrl, browser: 'Playwright Chromium headless', results }, null, 2) + '\n';
await writeFile(join(runOutput, 'smoke-results.json'), report);
for (const result of results) console.log(`${result.status.toUpperCase()} ${result.device} ${result.family}: ${result.failure || result.checks.join(', ')}`);
if (results.length === 11 && results.every((result) => result.status === 'pass')) {
  const finalScreenshots = join(output, 'screenshots');
  await mkdir(finalScreenshots, { recursive: true });
  for (const name of await readdir(screenshots)) await copyFile(join(screenshots, name), join(finalScreenshots, name));
  await writeFile(join(output, 'smoke-results.json'), report);
} else {
  console.error(`Smoke failed; artifacts retained at ${runOutput}`);
  process.exitCode = 1;
}
