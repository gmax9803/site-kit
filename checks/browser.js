// Rendered-page checks in headless Chromium, at each viewport width:
//   - axe accessibility scan (WCAG 2.2 AA as errors, best practices as warnings)
//   - no horizontal page scroll
//   - form inputs use the right type and autocomplete for what they collect
//   - full-page screenshots for a quick visual review in the CI report
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// What a field collects, guessed from its name, id or autocomplete token,
// and the input type and autocomplete it should then use.
const FIELD_KINDS = [
	{ kind: 'an email address', pattern: /e-?mail/i, type: 'email', autocomplete: 'email' },
	{ kind: 'a phone number', pattern: /phone|\btel\b|mobile/i, type: 'tel', autocomplete: 'tel' },
	{ kind: 'a web address', pattern: /website|\burl\b/i, type: 'url', autocomplete: 'url' },
];

/** Runs in the page: find inputs whose type or autocomplete don't fit. */
function auditFormFields(kinds) {
	const findings = [];
	const describe = (el) => {
		if (el.id) return `#${el.id}`;
		const name = el.getAttribute('name');
		return name ? `${el.localName}[name="${name}"]` : el.localName;
	};

	for (const input of document.querySelectorAll('input:not([type=hidden]), textarea')) {
		const hint = [input.name, input.id, input.getAttribute('autocomplete')].filter(Boolean).join(' ');
		const kind = kinds.find((k) => new RegExp(k.pattern.source, k.pattern.flags).test(hint));
		if (!kind) continue;

		const type = input.localName === 'textarea' ? 'textarea' : input.type;
		if (type !== kind.type) {
			findings.push({
				level: 'error',
				target: describe(input),
				message: `Collects ${kind.kind} but is type="${type}". Use type="${kind.type}" so phones show the right keyboard.`,
			});
		}
		if (!input.getAttribute('autocomplete')) {
			findings.push({
				level: 'warning',
				target: describe(input),
				message: `Add autocomplete="${kind.autocomplete}" so browsers can fill in ${kind.kind}.`,
			});
		}
	}

	for (const select of document.querySelectorAll('select:not([multiple])')) {
		const choices = [...select.options].filter((option) => option.value !== '' && !option.disabled);
		if (choices.length > 0 && choices.length <= 3) {
			findings.push({
				level: 'warning',
				target: describe(select),
				message: `A dropdown with ${choices.length} choice(s) hides them behind a click. Radio buttons or a segmented control show them at once.`,
			});
		}
	}

	return findings;
}

/** Runs in the page: elements that stick out past the right edge. */
function findOverflow() {
	const width = document.documentElement.clientWidth;
	if (document.documentElement.scrollWidth <= width + 1) return [];

	const offenders = [];
	for (const el of document.body.querySelectorAll('*')) {
		const rect = el.getBoundingClientRect();
		if (rect.width > 0 && rect.right > width + 1) {
			// Report the outermost offender only, not every descendant of it.
			if (!offenders.some((parent) => parent.contains(el))) offenders.push(el);
		}
		if (offenders.length >= 5) break;
	}

	return offenders.map((el) => {
		const cls = el.classList.length ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
		return `${el.localName}${el.id ? `#${el.id}` : ''}${cls}`;
	});
}

const launch = () =>
	chromium.launch({
		executablePath: process.env.SITE_KIT_CHROMIUM || undefined,
	});

/**
 * Check every page at every width. `pages` are URL paths such as `/about/`.
 * Returns a list of findings.
 */
export const checkPages = async ({ baseUrl, pages, widths, reportDir, screenshots }) => {
	const findings = [];
	const browser = await launch();

	try {
		for (const width of widths) {
			const context = await browser.newContext({
				viewport: { width, height: 900 },
				reducedMotion: 'reduce',
			});

			for (const page of pages) {
				const tab = await context.newPage();
				const where = `${page} @${width}px`;
				const errors = [];
				tab.on('pageerror', (error) => errors.push(error.message));

				await tab.goto(`${baseUrl}${page}`, { waitUntil: 'load' });

				for (const message of errors) {
					findings.push({ level: 'error', check: 'js-error', page: where, message });
				}

				const axe = await new AxeBuilder({ page: tab }).withTags([...WCAG_TAGS, 'best-practice']).analyze();
				for (const violation of axe.violations) {
					const isWcag = violation.tags.some((tag) => WCAG_TAGS.includes(tag));
					findings.push({
						level: isWcag ? 'error' : 'warning',
						check: `axe:${violation.id}`,
						page: where,
						message: `${violation.help} (${violation.helpUrl})`,
						target: violation.nodes
							.slice(0, 3)
							.map((node) => node.target.join(' '))
							.join(', '),
					});
				}

				const overflow = await tab.evaluate(findOverflow);
				if (overflow.length) {
					findings.push({
						level: 'error',
						check: 'layout:horizontal-scroll',
						page: where,
						message: 'The page scrolls sideways. These elements stick out past the viewport.',
						target: overflow.join(', '),
					});
				}

				// Field rules don't depend on width; run them once per page.
				if (width === widths[0]) {
					const kinds = FIELD_KINDS.map((k) => ({ ...k, pattern: { source: k.pattern.source, flags: k.pattern.flags } }));
					for (const finding of await tab.evaluate(auditFormFields, kinds)) {
						findings.push({ ...finding, check: 'forms:field-type', page });
					}
				}

				if (screenshots) {
					const name = `${page.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index'}@${width}.png`;
					await mkdir(reportDir, { recursive: true });
					await tab.screenshot({ path: path.join(reportDir, name), fullPage: true });
				}

				await tab.close();
			}

			await context.close();
		}
	} finally {
		await browser.close();
	}

	return findings;
};
