// Static HTML validation of every built page with html-validate.
//
// Formatting rules are off because the input is generated output, not
// hand-written markup. A site can add or relax rules with a
// `.htmlvalidate.json` in its root, which is merged over these defaults.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { HtmlValidate } from 'html-validate';

export const DEFAULT_CONFIG = {
	extends: ['html-validate:recommended'],
	rules: {
		// Generated markup: formatting and style choices are the compiler's.
		'attr-quotes': 'off',
		'attribute-boolean-style': 'off',
		'attribute-empty-style': 'off',
		'doctype-style': 'off',
		'no-inline-style': 'off',
		'no-trailing-whitespace': 'off',
		'void-style': 'off',
		'element-case': 'off',
		'attr-case': 'off',
		'no-raw-characters': 'off',
		'long-title': 'off',
		'no-redundant-role': 'warn',
		'prefer-native-element': 'warn',
		'unique-landmark': 'warn',
	},
};

const loadSiteConfig = async (cwd) => {
	const file = path.join(cwd, '.htmlvalidate.json');
	if (!existsSync(file)) return DEFAULT_CONFIG;

	const site = JSON.parse(await readFile(file, 'utf8'));
	return {
		...DEFAULT_CONFIG,
		...site,
		extends: site.extends ?? DEFAULT_CONFIG.extends,
		rules: { ...DEFAULT_CONFIG.rules, ...site.rules },
	};
};

/** Validate each HTML file. Returns a list of findings. */
export const checkHtml = async (files, { cwd = process.cwd(), dist }) => {
	const validator = new HtmlValidate(await loadSiteConfig(cwd));
	const findings = [];

	for (const file of files) {
		const report = await validator.validateFile(file);
		for (const result of report.results) {
			for (const message of result.messages) {
				findings.push({
					level: message.severity === 2 ? 'error' : 'warning',
					check: `html:${message.ruleId}`,
					page: path.relative(dist, file),
					message: `${message.message} (line ${message.line})`,
					target: message.selector ?? undefined,
				});
			}
		}
	}

	return findings;
};
