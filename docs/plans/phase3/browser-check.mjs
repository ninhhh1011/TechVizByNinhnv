import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const baseUrl = process.env.TECHVIZ_URL || 'http://127.0.0.1:3000/';
try {
  for (const [name, query, proposal, expected] of [
    ['unreviewed', 'phase3-unreviewed', { scenarioVersion: 1, title: 'Unknown', rendererType: 'array-pointer', nodes: [], steps: [{ stepIndex: 1, title: 'Step', explanation: 'Example', arrayData: { array: [2, 1], pointers: [] } }] }, 'Đề xuất AI chưa có nguồn'],
    ['missing-steps', 'phase3-missing-steps', { scenarioVersion: 1, title: 'Unknown', rendererType: 'array-pointer', nodes: [], steps: [] }, 'steps:'],
    ['preset-substring', 'Do not simulate Apache Kafka; explain why it is unsupported', { scenarioVersion: 1, title: 'Unknown', rendererType: 'array-pointer', nodes: [], steps: [] }, 'steps:'],
  ]) {
    const page = await browser.newPage();
    await page.route('**/api/groq', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(proposal) } }] }) }));
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const original = await page.locator('main').innerText();
    await page.getByPlaceholder(/Nhập thuật toán/).fill(query);
    await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
    await page.getByText(expected, { exact: false }).waitFor({ timeout: 5000 });
    assert.equal(await page.locator('main').innerText(), original, `${name} changed the current simulation`);
    console.log(`PASS ${name}: reason shown, current simulation unchanged`);
    await page.close();
  }
  const page = await browser.newPage();
  let aiCalls = 0;
  await page.route('**/api/groq', (route) => { aiCalls++; return route.abort(); });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByPlaceholder(/Nhập thuật toán/).fill('Redis Cache');
  await page.getByRole('button', { name: 'Trực quan hóa', exact: true }).click();
  assert.match(await page.locator('main').innerText(), /Redis/i);
  assert.equal(aiCalls, 0);
  console.log('PASS exact preset alias: selected without AI request');
  await page.close();
} finally {
  await browser.close();
}
