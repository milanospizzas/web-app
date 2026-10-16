import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8787');
assert(
  (base.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(base.hostname)) ||
    (base.protocol === 'https:' && base.hostname.endsWith('.workers.dev')),
  'Smoke checks must target a local preview or workers.dev, never the live domain/API.'
);

let checks = 0;
async function request(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    ...options,
  });
  checks += 1;
  return response;
}
function noindex(response) {
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
}

// Node fetch overwrites Sec-Fetch-Mode with "cors". Use an actual HTTP header
// here to exercise Cloudflare's navigation-vs-script asset routing behavior.
function navigationRequest(path, method) {
  checks += 1;
  const url = new URL(path, base);
  const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const pending = transport(
      url,
      {
        method,
        headers: { 'Sec-Fetch-Mode': 'navigate' },
        timeout: 15000,
      },
      (incoming) => {
        const chunks = [];
        incoming.on('data', (chunk) => chunks.push(chunk));
        incoming.on('error', reject);
        incoming.on('end', () =>
          resolve(
            new Response(method === 'HEAD' ? null : Buffer.concat(chunks), {
              status: incoming.statusCode,
              headers: incoming.headers,
            })
          )
        );
      }
    );
    pending.on('timeout', () => pending.destroy(new Error(`Timeout: ${url.pathname}`)));
    pending.on('error', reject);
    pending.end();
  });
}

for (const path of ['/', '/menu', '/menu/pizza', '/menu/pasta', '/about', '/contact', '/order']) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path} must load directly`);
  noindex(response);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="[^"]*noindex/);
  if (path === '/order') {
    const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter(([, , label]) =>
      /Continue to SkyTab|Open SkyTab ordering directly/.test(label)
    );
    assert.equal(
      anchors.length,
      2,
      'Both native handoff controls must be present without JavaScript'
    );
    for (const [, attributes] of anchors) {
      assert.doesNotMatch(attributes, /\btarget=/);
      const href = attributes.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&');
      assert.equal(
        href,
        'https://online.skytab.com/29f9af1c8689260fadade27c64cb9e55?source=direct'
      );
    }
    assert.doesNotMatch(html, /<iframe\b|<form\b/);
  }
  if (path === '/') {
    const script = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
    const image = html.match(/<img[^>]*src="([^"]+)"/)?.[1];
    assert(script && image, 'Export must contain script and image assets');
    for (const asset of [script, image]) {
      assert.equal(new URL(asset, base).origin, base.origin);
      assert.equal((await request(asset)).status, 200, `${asset} must load`);
    }
  }
}

const robots = await request('/robots.txt');
assert.equal(robots.status, 200);
noindex(robots);
const robotsText = await robots.text();
assert.match(robotsText, /User-Agent:\s*\*/i);
assert.match(robotsText, /Disallow:\s*\//i);
assert.doesNotMatch(robotsText, /(?:^|\n)Allow:|Sitemap:/i);

const sitemap = await request('/sitemap.xml');
assert.equal(sitemap.status, 200);
noindex(sitemap);
assert.doesNotMatch(await sitemap.text(), /<loc>/);

for (const path of [
  '/network',
  '/network/',
  '/network?source=direct',
  '/network/?utm_source=synthetic',
]) {
  for (const method of ['GET', 'HEAD']) {
    const response = await navigationRequest(path, method);
    assert.equal(response.status, 410, `${method} ${path} must remain Gone`);
    noindex(response);
    if (method === 'HEAD') assert.equal(await response.text(), '');
  }
}

for (const path of [
  '/not-a-page',
  '/not-a-page/nested',
  '/api/health',
  '/_next/static/missing.js',
]) {
  const response = await request(path);
  assert.equal(response.status, 404, `${path} must not use SPA fallback or proxy to the API`);
  noindex(response);
}

const query = '?source=homepage-hero&utm_source=synthetic';
const slash = await request(`/order/${query}`);
assert.equal(slash.status, 301, 'Existing page trailing slash must permanently redirect');
const slashLocation = new URL(slash.headers.get('location'), base);
assert.equal(slashLocation.origin, base.origin);
assert.equal(slashLocation.pathname, '/order');
assert.equal(
  slashLocation.search,
  query,
  'Canonicalization must preserve the query for client-side allowlisting'
);
const htmlForm = await request(`/order.html${query}`);
assert([301, 307, 308].includes(htmlForm.status));
assert.equal(new URL(htmlForm.headers.get('location'), base).pathname, '/order');

console.log(
  `Cloudflare static-host smoke passed: ${checks} same-origin read-only requests to ${base.origin}.`
);
