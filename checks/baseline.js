// Known errors a site has accepted for now, so the checks can gate new
// problems while old ones are fixed. Stored in the site's root as
// site-kit-baseline.json and written with `site-kit check --update-baseline`.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const BASELINE_FILE = 'site-kit-baseline.json';

const keyOf = ({ check, page, target }) => JSON.stringify([check, page, target ?? '']);

export const readBaseline = async (file) => {
	if (!existsSync(file)) return [];
	const data = JSON.parse(await readFile(file, 'utf8'));
	return data.findings ?? [];
};

export const writeBaseline = async (file, findings) => {
	const entries = findings
		.filter((finding) => finding.level === 'error')
		.map(({ check, page, target, message }) => ({ check, page, target, message }))
		.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
	const body = {
		note: 'Known errors accepted for now. Fix them and run `site-kit check --update-baseline` to shrink this list. Never add to it by hand.',
		findings: entries,
	};
	await writeFile(file, `${JSON.stringify(body, null, '\t')}\n`);
	return entries.length;
};

/**
 * Mark errors that are in the baseline as `known`. Returns the baseline
 * entries that no longer occur (fixed, so the baseline can shrink).
 */
export const applyBaseline = (findings, baseline) => {
	const known = new Set(baseline.map(keyOf));
	const seen = new Set();

	for (const finding of findings) {
		const key = keyOf(finding);
		if (finding.level === 'error' && known.has(key)) {
			finding.level = 'known';
			seen.add(key);
		}
	}

	return baseline.filter((entry) => !seen.has(keyOf(entry)));
};
