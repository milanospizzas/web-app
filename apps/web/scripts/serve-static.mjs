import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'out');
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const contentTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = normalize(decoded).replace(/^[/\\]+/, '');
  const absolute = resolve(root, relative);
  return absolute === root || absolute.startsWith(`${root}${sep}`) ? absolute : null;
}

function resolveFile(pathname) {
  if (pathname === '/') return join(root, 'index.html');
  const requested = safePath(pathname);
  if (!requested) return null;

  const candidates = extname(requested)
    ? [requested]
    : [`${requested}.html`, join(requested, 'index.html')];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

createServer((request, response) => {
  try {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (pathname === '/network' || pathname === '/network/') {
      response.writeHead(410, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Gone');
      return;
    }

    const file = resolveFile(pathname);
    if (!file) {
      const notFound = join(root, '404.html');
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      createReadStream(notFound).pipe(response);
      return;
    }

    const extension = extname(file).toLowerCase();
    const immutable = /[/\\](?:_next|images)[/\\]/.test(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      'Cache-Control': immutable
        ? 'public, max-age=2592000, immutable'
        : 'public, max-age=0, must-revalidate',
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Milano's static site listening on http://localhost:${port}`);
});
