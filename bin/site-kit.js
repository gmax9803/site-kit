#!/usr/bin/env node
// site-kit check: validate a built static site.
//
//   site-kit check [--dist dist] [--widths 360,1280] [--pages /,/about/]
//                  [--report site-kit-report] [--no-browser] [--no-screenshots]
//   site-kit install-browser    (CI: download the Chromium the checks use)
//
// Exits 1 when any check reports an error. Warnings are printed but pass.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { checkHtml } from '../checks/html.js';
import { serveDist } from '../checks/server.js';
import { urlPathFor } from '../checks/pages.js';

const USAGE = `Usage: site-kit check [options]
       site-kit install-browser

  --dist <dir>        Built site folder (default: dist)
  --widths <list>     Viewport widths in px (default: 360,1280)
  --pages <list>      URL paths to check (default: every built page)
  --report <dir>      Where screenshots go (default: site-kit-report)
  --no-browser        Only run the static HTML checks
  --no-screenshots    Skip saving screenshots`;

const listHtml = async (dir) => {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
		.map((entry) => path.join(entry.parentPath, entry.name))
		.sort();
};

const print = (findings) => {
	const byPage = Map.groupBy(findings, (finding) => finding.page);
	for (const [page, items] of byPage) {
		console.log(`\n${page}`);
		for (const item of items) {
			const mark = item.level === 'error' ? '✗' : '!';
			console.log(`  ${mark} [${item.check}] ${item.message}`);
			if (item.target) console.log(`      at ${item.target}`);
		}
	}
};

const main = async () => {
	const [command, ...rest] = process.argv.slice(2);
	if (command === 'install-browser') {
		// Use the playwright-core this package resolves, so the browser
		// revision always matches the library version.
		const pkg = createRequire(import.meta.url).resolve('playwright-core/package.json');
		const cli = path.join(path.dirname(pkg), 'cli.js');
		const result = spawnSync(process.execPath, [cli, 'install', ...rest, 'chromium'], { stdio: 'inherit' });
		process.exit(result.status ?? 1);
	}
	if (command !== 'check') {
		console.log(USAGE);
		process.exit(command ? 2 : 0);
	}

	const { values } = parseArgs({
		args: rest,
		options: {
			dist: { type: 'string', default: 'dist' },
			widths: { type: 'string', default: '360,1280' },
			pages: { type: 'string' },
			report: { type: 'string', default: 'site-kit-report' },
			'no-browser': { type: 'boolean', default: false },
			'no-screenshots': { type: 'boolean', default: false },
		},
	});

	const dist = path.resolve(values.dist);
	if (!existsSync(dist)) {
		console.error(`No built site at ${dist}. Run the build first.`);
		process.exit(2);
	}

	const files = await listHtml(dist);
	const pages = values.pages ? values.pages.split(',').map((page) => page.trim()) : files.map((file) => urlPathFor(dist, file));
	const widths = values.widths.split(',').map(Number);

	console.log(`Checking ${files.length} HTML file(s) in ${path.relative(process.cwd(), dist) || '.'}`);
	const findings = await checkHtml(files, { dist });

	if (!values['no-browser']) {
		const { checkPages } = await import('../checks/browser.js');
		const server = await serveDist(dist);
		try {
			console.log(`Rendering ${pages.length} page(s) at ${widths.join(', ')}px`);
			findings.push(
				...(await checkPages({
					baseUrl: server.url,
					pages,
					widths,
					reportDir: path.resolve(values.report),
					screenshots: !values['no-screenshots'],
				})),
			);
		} finally {
			await server.close();
		}
	}

	print(findings);
	const errors = findings.filter((finding) => finding.level === 'error').length;
	const warnings = findings.length - errors;
	console.log(`\n${errors} error(s), ${warnings} warning(s)`);
	process.exit(errors ? 1 : 0);
};

main().catch((error) => {
	console.error(error);
	process.exit(2);
});
