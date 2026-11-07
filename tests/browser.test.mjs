import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { symptoms } from '../public/diagnostics.js';

test('desktop and mobile guided checks, consent, navigation, and failure handling', async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; const counts = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://guide.test/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/api/events') { counts.push(route.request().postDataJSON()); return route.fulfill({ status: 204 }); }
      const name = pathname === '/' ? 'index.html' : pathname.slice(1);
      try {
        return route.fulfill({ body: await readFile(new URL(`../public/${name}`, import.meta.url)), contentType: name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html' });
      } catch { return route.fulfill({ status: 404 }); }
    });
    await page.goto('https://guide.test/');
    await page.locator('.symptom').first().waitFor();
    assert.equal(await page.locator('.symptom').count(), 7);
    assert.equal(await page.locator('#check-panel').isVisible(), false);
    await page.locator('#make').selectOption('ford');
    assert.match(await page.locator('#make-note').textContent(), /older Ford/);
    for (const symptom of symptoms) {
      await page.locator(`[data-symptom="${symptom.id}"]`).click();
      assert.equal(await page.locator(`[data-symptom="${symptom.id}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#check-title').evaluate(el => el === document.activeElement), true);
      await page.locator('#answers').getByRole('button', { name: 'Not sure / stop here', exact: true }).click();
      assert.equal(await page.locator('#result').isVisible(), true);
      assert.match(await page.locator('#outcome-title').textContent(), /pause and get help/);
    }
    assert.equal(counts.length, 0, 'no counts without consent');
    await page.locator('#measurement').check();
    await page.locator('[data-symptom="rapid-click"]').click();
    await page.locator('#answers').getByRole('button', { name: 'Yes', exact: true }).click();
    await page.locator('#answers').getByRole('button', { name: 'Yes', exact: true }).click();
    assert.match(await page.locator('#outcome-title').textContent(), /recharge/);
    assert.equal(await page.locator('#summary li').count(), 2);
    await page.locator('[data-feedback="helpful"]').click();
    assert.match(await page.locator('#feedback-status').textContent(), /Thanks/);
    await page.waitForFunction(() => document.querySelector('#feedback').hidden);
    await page.locator('#back').click();
    assert.equal(await page.locator('#result').isVisible(), false);
    await page.locator('#answers').getByRole('button', { name: 'No', exact: true }).click();
    assert.match(await page.locator('#outcome-title').textContent(), /starting-circuit test/);
    await page.locator('#restart').click();
    assert.equal(await page.locator('#check-panel').isVisible(), false);
    assert.equal(await page.locator('.symptom[aria-pressed="true"]').count(), 0);
    assert.equal(await page.locator('#amazon-picks').getAttribute('href'), 'https://link.amazon/B0d0Xe9hZ');
    for (const event of ['symptom_selected', 'check_completed', 'flow_completed', 'helpful']) assert.ok(counts.some(item => item.event === event), event);
    await page.locator('#measurement').uncheck();
    const countBefore = counts.length;
    await page.locator('[data-symptom="starts-dies"]').click();
    await page.waitForTimeout(100);
    assert.equal(counts.length, countBefore);
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow on mobile');
    await page.screenshot({ path: '/tmp/nostartpro-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('#restart').click();
    await page.screenshot({ path: '/tmp/nostartpro-desktop.png', fullPage: true });
    await page.locator('#measurement').check();
    await page.route('https://guide.test/api/events', route => route.fulfill({ status: 503 }));
    await page.locator('[data-symptom="single-click"]').click();
    await page.locator('#measurement-status').filter({ hasText: 'unavailable' }).waitFor();
    assert.equal(await page.locator('#answers button').count(), 3, 'guide works despite metrics failure');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('Do Not Track disables measurement and no-JavaScript users get fallback guidance', async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
    await page.route('https://guide.test/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      const name = pathname === '/' ? 'index.html' : pathname.slice(1);
      return route.fulfill({ body: await readFile(new URL(`../public/${name}`, import.meta.url)), contentType: name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html' });
    });
    await page.goto('https://guide.test/');
    await page.locator('.symptom').first().waitFor();
    assert.equal(await page.locator('#measurement').isDisabled(), true);
    assert.match(await page.locator('#measurement-status').textContent(), /Do Not Track/);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noJS = await context.newPage();
    await noJS.route('https://guide.test/**', async route => route.fulfill({ body: await readFile(new URL('../public/index.html', import.meta.url)), contentType: 'text/html' }));
    await noJS.goto('https://guide.test/');
    assert.equal(await noJS.getByRole('heading', { name: 'JavaScript is needed for the interactive guide.' }).isVisible(), true);
    await context.close();
  } finally { await browser.close(); }
});
