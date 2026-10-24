import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const url = process.env.TECHVIZ_STAGING_URL || 'https://techvizbyninhnv.pages.dev/';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const response = await page.request.fetch(new URL('/api/groq', url).href, { method: 'OPTIONS' });
  const scripts = await page.locator('script[src]').evaluateAll((elements) => elements.map((element) => element.src));
  let groqKeyPatternFound = false;
  for (const script of scripts.filter((script) => new URL(script).origin === new URL(url).origin)) {
    const body = await (await page.request.get(script)).text();
    groqKeyPatternFound ||= /gsk_[A-Za-z0-9]{30,}/.test(body);
  }
  const evidenceLabelPresent = (await page.getByText('Minh họa biên soạn — chưa xác minh toàn bộ', { exact: true }).count()) > 0;
  const headers = response.headers();
  const report = {
    checkedAt: new Date().toISOString(), url, httpStatus: response.status(), optionsAllow: headers.allow ?? null,
    corsOrigin: headers['access-control-allow-origin'] ?? null, evidenceLabelPresent, groqKeyPatternFound, errors,
    compatibleWithLocalRelease: response.status() === 204 && !!headers.allow?.includes('POST') && !headers['access-control-allow-origin'] && evidenceLabelPresent && !groqKeyPatternFound && !errors.length,
    limit: 'Read-only page/assets/OPTIONS checks. No Groq request, provider spending, deployment mutation or claim of exhaustive secret detection.',
  };
  await page.screenshot({ path: fileURLToPath(new URL('./staging.png', import.meta.url)), fullPage: true, animations: 'disabled' });
  await writeFile(new URL('./staging-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!report.compatibleWithLocalRelease) process.exitCode = 1;
} finally { await browser.close(); }
