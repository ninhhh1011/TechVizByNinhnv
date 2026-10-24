import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    let calls = 0;
    await page.route('**/api/groq', async (route) => {
      calls++;
      assert.deepEqual(Object.keys(route.request().postDataJSON()), ['query']);
      await route.fulfill({ json: { choices: [{ message: { content: '{"status":"unsupported","reason":"Chủ đề chưa có nguồn được duyệt."}' } }] } });
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.getByLabel('Chủ đề cần trực quan hóa').fill('Bubble pass [3,1,2]');
    await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
    await page.getByText('Bubble Sort — một lượt', { exact: true }).first().waitFor();
    assert.equal(calls, 0);
    await page.getByRole('button', { name: 'Chuyển đến Bước 5' }).click();
    assert.ok(await page.getByText('Mô phỏng đã kiểm chứng trong phạm vi nêu dưới', { exact: true }).count());
    await page.locator('summary').filter({ hasText: 'Nguồn và giới hạn' }).focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.getByText(/Reference runner bubble-pass\/v1/).isVisible());
    await page.getByLabel('Chủ đề cần trực quan hóa').fill('unknown-topic');
    await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
    await page.getByText('Chủ đề chưa có nguồn được duyệt.', { exact: true }).waitFor();
    assert.ok(await page.getByText('Bubble Sort — một lượt', { exact: true }).first().isVisible());
    assert.equal(calls, 1);
    await page.getByLabel('Chủ đề cần trực quan hóa').fill('Bubble pass [' + Array.from({ length: 20 }, (_, i) => 20 - i).join(',') + ']');
    await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
    await page.getByRole('button', { name: 'Chuyển đến Bước 39' }).click();
    for (const index of [0, 19]) {
      const bar = page.getByText('[' + index + ']', { exact: true }).locator('../..');
      await bar.scrollIntoViewIfNeeded();
      const box = await bar.boundingBox(), port = await bar.locator('..').boundingBox();
      assert.ok(box.x >= port.x - 1 && box.x + box.width <= port.x + port.width + 1, 'array endpoint ' + index + ' must be reachable inside its scrollport');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('PASS ' + viewport.width + ': reference runner, evidence label, unsupported AI preserves frame');
    await page.close();
  }
  const page = await browser.newPage();
  await page.route('**/api/groq', (route) => route.abort('failed'));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByLabel('Chủ đề cần trực quan hóa').fill('network-failure');
  await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
  await page.getByText('Không kết nối được dịch vụ AI.', { exact: true }).waitFor();
  assert.ok(await page.getByText('Minh họa biên soạn — chưa xác minh toàn bộ', { exact: true }).count());
  console.log('PASS network error preserves illustrative preset');
} finally {
  await browser.close();
}
