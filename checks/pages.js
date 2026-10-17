import path from 'node:path';

/** dist/a/index.html -> /a/, dist/a.html -> /a */
export const urlPathFor = (dist, file) => {
	const rel = path.relative(dist, file).split(path.sep).join('/');
	if (rel === 'index.html') return '/';
	if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
	return `/${rel.replace(/\.html$/, '')}`;
};
