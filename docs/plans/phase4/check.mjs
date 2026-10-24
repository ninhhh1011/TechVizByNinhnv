import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByText('A* / Dijkstra', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Chuyển đến Bước 4' }).click();
  const pathCells = await page.locator('button[title^="Tọa độ"]').evaluateAll((cells) =>
    cells.filter((cell) => cell.className.includes('font-bold z-10')).length);
  assert.equal(pathCells, 24, 'frame 4 must show all 24 intermediate path cells from its snapshot');
  assert.match(await page.locator('main').innerText(), /Độ dài đường đi:\s*25 bước/, 'path length counts edges');
  console.log('PASS grid frame 4 uses snapshot path and edge count');
  const editable = page.locator('button[title^="Tọa độ [0, 0]"]');
  await editable.press('Enter');
  assert.match(await editable.getAttribute('aria-label'), /tường/);
  await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
  assert.doesNotMatch(await editable.getAttribute('aria-label'), /tường/, 'reset must leave the edited grid and restore the preset snapshot');
  console.log('PASS grid keyboard editing and reset restore the snapshot');

  await page.getByText('Kafka', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Chuyển đến Bước 2' }).click();
  const packet = page.locator('div.absolute.left-0.top-0').first();
  await packet.waitFor();
  const before = await packet.getAttribute('style');
  await page.waitForTimeout(450);
  assert.equal(await packet.getAttribute('style'), before, 'packet must stay still while playback is paused');
  console.log('PASS paused flow packet stays still');

  const path = page.locator('path[stroke="url(#flowGrad)"]').first();
  const coordinates = (await path.getAttribute('d')).match(/-?\d+(?:\.\d+)?/g).map(Number);
  await page.getByRole('button', { name: 'Phóng to (+)' }).click();
  await page.getByRole('button', { name: 'Bước trước', exact: true }).click();
  await page.getByRole('button', { name: 'Bước tiếp theo', exact: true }).click();
  const zoomed = (await path.getAttribute('d')).match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.ok(coordinates.every((value, i) => Math.abs(value - zoomed[i]) < 1), 'zoom must not scale local packet coordinates a second time');
  console.log('PASS flow coordinates stay aligned after zoom and seek');

  await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
  await page.clock.install();
  await page.getByRole('button', { name: 'Chạy tự động', exact: true }).click();
  await page.clock.runFor(3500);
  assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 2\s*\//);
  await page.getByRole('button', { name: '2x', exact: true }).click();
  await page.clock.runFor(1750);
  assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 3\s*\//);
  await page.getByRole('button', { name: 'Chuyển đến Bước 2' }).click();
  await page.clock.runFor(7000);
  assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 2\s*\//, 'manual seek pauses the clock');
  await page.getByRole('button', { name: 'Về đầu kịch bản' }).click();
  assert.match(await page.locator('main').innerText(), /Đang xem:\s*Bước 1\s*\//);
  console.log('PASS fake clock: play, speed, seek, pause and reset');

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto(baseUrl, { waitUntil: 'networkidle' });
  for (const chip of ['Kafka', 'QuickSort', 'A* / Dijkstra', 'PSO / Swarm 2D', 'MergeSort (Tree)']) {
    await reduced.getByText(chip, { exact: true }).first().click();
    await reduced.getByRole('button', { name: 'Chạy tự động', exact: true }).click();
    assert.equal(await reduced.locator('.simulation-stage').getAttribute('data-playing'), 'false', chip);
    assert.equal(await reduced.locator('.simulation-stage svg animate').count(), 0, chip);
    await reduced.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  }
  console.log('PASS reduced motion on mobile across five renderer families');
} finally {
  await browser.close();
}
