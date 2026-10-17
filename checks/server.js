// A tiny static server for a built `dist/` folder, matching how Cloudflare
// Pages resolves paths: `/a/` -> a/index.html, `/a` -> a.html or a/index.html,
// and a missing page -> 404.html with status 404.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

const isFile = async (file) => {
	try {
		return (await stat(file)).isFile();
	} catch {
		return false;
	}
};

const resolveFile = async (root, urlPath) => {
	const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
	const base = path.join(root, clean);
	if (!base.startsWith(root)) return null;

	const candidates = clean.endsWith('/')
		? [path.join(base, 'index.html')]
		: [base, `${base}.html`, path.join(base, 'index.html')];

	for (const file of candidates) {
		if (await isFile(file)) return file;
	}
	return null;
};

/** Serve `root` on a random local port. Resolves to { url, close }. */
export const serveDist = (root) =>
	new Promise((resolve) => {
		const absRoot = path.resolve(root);
		const server = createServer(async (req, res) => {
			const { pathname } = new URL(req.url ?? '/', 'http://localhost');
			let file = await resolveFile(absRoot, pathname);
			let status = 200;

			if (!file) {
				status = 404;
				file = path.join(absRoot, '404.html');
				if (!(await isFile(file))) {
					res.writeHead(404).end('Not found');
					return;
				}
			}

			res.writeHead(status, {
				'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
			});
			res.end(await readFile(file));
		});

		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			resolve({
				url: `http://127.0.0.1:${port}`,
				close: () => new Promise((done) => server.close(done)),
			});
		});
	});
