import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL('../public/', import.meta.url);
async function files(dir = '') {
  const entries = await readdir(new URL(dir, base), { withFileTypes: true });
  const result = [];
  for (const item of entries) {
    const path = `${dir}${item.name}`;
    result.push(...(item.isDirectory() ? await files(`${path}/`) : [path]));
  }
  return result;
}
async function serve(page) {
  await page.route('https://guide.test/**', async route => {
    const url = new URL(route.request().url());
    const name = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const types = { js: 'application/javascript', css: 'text/css', html: 'text/html', png: 'image/png', svg: 'image/svg+xml' };
    try { await route.fulfill({ body: await readFile(new URL(name.slice(1), base)), contentType: types[name.split('.').pop()] || 'text/plain' }); }
    catch { await route.fulfill({ status: 404 }); }
  });
}
test('search pages have unique metadata, sitemap entries, and working local resources', async () => {
  const all = (await files()).filter(name => name.endsWith('.html'));
  const sitemap = await readFile(new URL('sitemap.xml', base), 'utf8');
  const titles = new Set();
  for (const file of all) {
    const html = await readFile(new URL(file, base), 'utf8');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    const title = html.match(/<title>(.*?)<\/title>/)[1]; assert.ok(!titles.has(title)); titles.add(title);
    const url = file.replace(/index\.html$/, '');
    if (!file.startsWith('launch/')) {
      assert.ok(html.includes(`rel="canonical" href="https://kellyreedbook.netlify.app/${url}"`), file);
      assert.ok(html.includes('property="og:image"'), file);
      assert.ok(sitemap.includes(`<loc>https://kellyreedbook.netlify.app/${url}</loc>`), file);
    } else assert.ok(html.includes('noindex,follow'));
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
      const path = new URL(href, 'https://guide.test').pathname;
      const asset = path.endsWith('/') ? `${path}index.html` : path;
      assert.ok((await stat(new URL(asset.slice(1), base))).isFile(), `${file}: ${href}`);
    }
  }
  assert.equal((sitemap.match(/<loc>/g) || []).length, 8);
  const png = await readFile(new URL('assets/nostartpro-share.png', base));
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
});
test('deep links, privacy-safe sharing, clipboard fallback, and campaign links work on mobile', async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await serve(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copied = text; } }, configurable: true });
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.goto('https://guide.test/?symptom=rapid-click&utm_source=private_source&answer=yes#guide');
    await page.locator('[data-symptom="rapid-click"][aria-pressed="true"]').waitFor();
    await page.locator('#copy-guide').click();
    assert.equal(await page.evaluate(() => window.copied), 'https://kellyreedbook.netlify.app/?symptom=rapid-click#guide');
    await page.locator('#restart').click(); await page.locator('#copy-guide').click();
    assert.equal(await page.evaluate(() => window.copied), 'https://kellyreedbook.netlify.app/');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } }));
    await page.locator('#share-guide').click();
    assert.match(await page.locator('#share-status').textContent(), /link is selected/);
    assert.equal(await page.locator('#share-url').evaluate(el => el === document.activeElement), true);
    await page.goto('https://guide.test/?symptom=invalid');
    await page.locator('.symptom').first().waitFor();
    assert.equal(await page.locator('#check-panel').isVisible(), false);
    await page.goto('https://guide.test/guides/car-clicks-once-but-wont-start/');
    await page.getByRole('link', { name: 'Start these guided checks' }).click();
    await page.locator('[data-symptom="single-click"][aria-pressed="true"]').waitFor();
    await page.goto('https://guide.test/launch/');
    await page.locator('#source').fill('local_garage');
    await page.locator('#medium').selectOption('referral');
    await page.locator('#destination').selectOption('/guides/car-cranks-slowly/');
    await page.getByRole('button', { name: 'Create link' }).click();
    const url = new URL(await page.locator('#campaign-output').inputValue());
    assert.equal(url.origin, 'https://kellyreedbook.netlify.app');
    assert.equal(url.pathname, '/guides/car-cranks-slowly/');
    assert.equal(url.searchParams.get('utm_source'), 'local_garage');
    assert.equal(url.searchParams.get('utm_medium'), 'referral');
    await page.getByRole('button', { name: 'Copy campaign link' }).click();
    assert.equal(await page.evaluate(() => window.copied), url.href);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '/tmp/nostartpro-launch-mobile.png', fullPage: true });
    await page.goto('https://guide.test/launch/flyer/');
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: '/tmp/nostartpro-flyer.pdf', preferCSSPageSize: true, printBackground: true });
    assert.equal(await page.locator('#print-flyer').isVisible(), false);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
