import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { urlPathFor } from '../checks/pages.js';
import { checkHtml } from '../checks/html.js';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const badSite = path.join(here, 'fixtures/bad-site');
const cli = path.join(here, '../bin/site-kit.js');

test('maps built files to URL paths', () => {
	assert.equal(urlPathFor('/d', '/d/index.html'), '/');
	assert.equal(urlPathFor('/d', '/d/about/index.html'), '/about/');
	assert.equal(urlPathFor('/d', '/d/404.html'), '/404');
});

test('html checks flag an image without alt and an untyped button', async () => {
	const findings = await checkHtml([path.join(badSite, 'index.html')], { dist: badSite, cwd: here });
	const rules = findings.map((finding) => finding.check);
	assert.ok(rules.includes('html:wcag/h37'), rules.join(', '));
	assert.ok(rules.includes('html:no-implicit-button-type'), rules.join(', '));
});

test('browser checks flag field types, small dropdowns and sideways scroll', async () => {
	const result = await run('node', [cli, 'check', '--dist', badSite, '--no-screenshots', '--widths', '360']).catch((error) => error);
	assert.equal(result.code, 1, 'exits 1 on errors');
	assert.match(result.stdout, /\[forms:field-type\] Collects an email address but is type="text"/);
	assert.match(result.stdout, /\[forms:field-type\] A dropdown with 2 choice/);
	assert.match(result.stdout, /\[layout:horizontal-scroll\]/);
	assert.match(result.stdout, /\[axe:image-alt\]/);
	assert.doesNotMatch(result.stdout, /\/about\/ @360px/, 'a clean page reports nothing');
});

test('a baseline turns known errors into passes but still fails on new ones', async () => {
	const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-'));
	const args = [cli, 'check', '--dist', badSite, '--no-screenshots', '--widths', '360'];

	await run('node', [...args, '--update-baseline'], { cwd });
	const clean = await run('node', args, { cwd });
	assert.match(clean.stdout, /0 error\(s\), \d+ warning\(s\), \d+ known error\(s\)/);

	// Drop one entry: that error is new again and fails the run.
	const file = path.join(cwd, 'site-kit-baseline.json');
	const baseline = JSON.parse(await readFile(file, 'utf8'));
	baseline.findings.shift();
	await writeFile(file, JSON.stringify(baseline));
	const result = await run('node', args, { cwd }).catch((error) => error);
	assert.equal(result.code, 1);
	assert.match(result.stdout, /1 error\(s\)/);
});
