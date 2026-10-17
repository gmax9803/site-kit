// Drives the demo page's CopyButtons in Chromium. Needs `pnpm demo:build` first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serveDist } from '../checks/server.js';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../demo/dist');
let server;
let browser;
let page;

before(async () => {
	assert.ok(existsSync(dist), 'build the demo first: pnpm demo:build');
	server = await serveDist(dist);
	browser = await chromium.launch({ executablePath: process.env.SITE_KIT_CHROMIUM || undefined });
	const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
	page = await context.newPage();
	await page.goto(server.url);
});

after(async () => {
	await browser?.close();
	await server?.close();
});

const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

test('icon button copies its value, confirms, then resets', async () => {
	const button = page.getByTestId('icon-value');
	await button.click();
	assert.equal(await clipboard(), 'hello@example.com');
	assert.equal(await button.getAttribute('data-copy-state'), 'copied');
	assert.equal(await button.locator('[data-sk-copy-status]').textContent(), 'Copied');
	assert.equal(await button.getAttribute('aria-label'), 'Copy email address', 'accessible name stays put');

	await page.waitForFunction((el) => !el.dataset.copyState, await button.elementHandle(), { timeout: 3000 });
	assert.equal(await button.locator('[data-sk-copy-status]').textContent(), '');
});

test('target button copies the element text', async () => {
	await page.getByTestId('icon-target').click();
	assert.equal(await clipboard(), 'ABCD 1234 EF56 7890');
});

test('text button swaps its label without changing width', async () => {
	const button = page.getByTestId('text-value');
	const before = await button.boundingBox();
	await button.click();
	assert.equal(await clipboard(), 'Line one\nLine two');
	assert.equal(await button.locator('[data-sk-copy-status]').textContent(), 'Copied!');
	const after = await button.boundingBox();
	assert.equal(after.width, before.width);
});

test('a value set at runtime is copied', async () => {
	await page.getByTestId('runtime').click();
	assert.equal(await clipboard(), `${server.url}/`);
});

test('a failed copy shows the failed state', async () => {
	await page.evaluate(() => {
		navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
		document.execCommand = () => false;
	});
	const button = page.getByTestId('icon-target');
	await page.waitForFunction((el) => !el.dataset.copyState, await button.elementHandle(), { timeout: 3000 });
	await button.click();
	assert.equal(await button.getAttribute('data-copy-state'), 'failed');
	assert.equal(await button.locator('[data-sk-copy-status]').textContent(), 'Copy failed');
});
