import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const approvedStorefront = 'https://online.skytab.com/29f9af1c8689260fadade27c64cb9e55';
const webDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function attribute(tag, name) {
  return tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

// This guard is intentionally stricter than validate-static.mjs, which also accepts
// production output. Cloudflare currently hosts only the unlaunched staging site.
export function assertStagingFiles(files) {
  const errors = [];
  const pages = [...files.keys()].filter((name) => name.endsWith('.html') && name !== '404.html');
  if (pages.length !== 27) errors.push(`Expected 27 public pages, found ${pages.length}`);
  for (const required of ['index.html', 'order.html', '404.html', 'robots.txt', 'sitemap.xml']) {
    if (!files.has(required)) errors.push(`Missing ${required}`);
  }

  for (const page of pages) {
    const html = files.get(page);
    const robots = [...html.matchAll(/<meta\b[^>]*>/gi)]
      .map(([tag]) => ({ name: attribute(tag, 'name'), content: attribute(tag, 'content') }))
      .filter((tag) => tag.name?.toLowerCase() === 'robots');
    if (
      !robots.length ||
      robots.some(({ content }) => {
        const directives = (content ?? '').toLowerCase().split(/\s*,\s*/);
        return (
          !directives.includes('noindex') ||
          !directives.includes('nofollow') ||
          directives.includes('index') ||
          directives.includes('follow')
        );
      })
    )
      errors.push(`${page}: staging requires noindex, nofollow`);
    if (page !== 'order.html' && html.includes('online.skytab.com')) {
      errors.push(`${page}: SkyTab destination escaped the /order boundary`);
    }
    if (
      /googletagmanager\.com|google-analytics\.com|<meta\b[^>]*name=["']google-site-verification["']/i.test(
        html
      )
    ) {
      errors.push(`${page}: analytics or search verification must remain disabled`);
    }
  }

  // Require the universal disallow-only profile, not merely one matching line in
  // a file that could contain a more specific crawler group or an Allow rule.
  const robotsLines = (files.get('robots.txt') ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean);
  if (
    robotsLines.length !== 2 ||
    !/^User-agent:\s*\*$/i.test(robotsLines[0] ?? '') ||
    !/^Disallow:\s*\/$/i.test(robotsLines[1] ?? '')
  ) {
    errors.push('robots.txt: expected only User-agent: * and Disallow: /');
  }
  const sitemap = files.get('sitemap.xml') ?? '';
  if (!/<urlset(?:\s|>)/i.test(sitemap) || /<(?:[\w.-]+:)?loc(?:\s|>)/i.test(sitemap)) {
    errors.push('sitemap.xml: staging must have an empty URL set');
  }

  const orderHtml = files.get('order.html') ?? '';
  const serializedOrder = orderHtml.replaceAll('\\"', '"');
  for (const [key, value] of [
    ['provider', 'skytab'],
    ['mode', 'redirect'],
    ['checkoutUrl', approvedStorefront],
  ]) {
    if (!serializedOrder.includes(`"${key}":"${value}"`)) {
      errors.push(`order.html: expected approved ${key}`);
    }
  }
  if (
    !serializedOrder.includes('"iframeEnabled":false') ||
    /"mode":"iframe"|"provider":"custom"|"iframeEnabled":true|<iframe\b/i.test(serializedOrder)
  ) {
    errors.push('order.html: custom ordering and iframe mode must remain inactive');
  }
  const anchors = [...orderHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  for (const label of ['Continue to SkyTab', 'Open SkyTab ordering directly']) {
    const matching = anchors.filter(
      ([, , content]) => content.replace(/<[^>]*>/g, '').trim() === label
    );
    if (
      matching.length !== 1 ||
      attribute(matching[0]?.[1] ?? '', 'href') !== `${approvedStorefront}?source=direct` ||
      attribute(matching[0]?.[1] ?? '', 'target') !== undefined
    ) {
      errors.push(`order.html: ${label} must be a same-tab anchor to the approved storefront`);
    }
  }
  if (errors.length) throw new Error(`Cloudflare staging guard failed:\n${errors.join('\n')}`);
  return pages.sort();
}

export function assertStagingOutput(outputDirectory) {
  const root = resolve(outputDirectory);
  const files = new Map();
  function visit(directory) {
    // Refuse links/junctions so preparation cannot follow or overwrite an
    // output path outside this build's directory.
    if (lstatSync(directory).isSymbolicLink())
      throw new Error(`Linked output path is not allowed: ${directory}`);
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Linked output path is not allowed: ${path}`);
      if (stat.isDirectory()) visit(path);
      else if (stat.isFile()) {
        const name = relative(root, path).replaceAll('\\', '/');
        if (name.endsWith('.html') || name === 'robots.txt' || name === 'sitemap.xml') {
          files.set(name, readFileSync(path, 'utf8'));
        }
      }
    }
  }
  visit(root);
  return assertStagingFiles(files);
}

export function cloudflareMetadata(pages) {
  return {
    headers: `# Generated only for the Cloudflare staging export.
/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# Next's content-addressed assets only; photos and HTML revalidate by default.
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`,
    redirects:
      '# Generated exact routes; no wildcard redirect for missing pages.\n' +
      pages
        .filter((page) => page !== 'index.html')
        .map((page) => {
          const route = `/${page.replace(/\.html$/, '').replace(/\/index$/, '')}`;
          return `${route}/ ${route} 301`;
        })
        .join('\n') +
      '\n',
  };
}

export function prepareCloudflare(outputDirectory = join(webDirectory, 'out')) {
  const pages = assertStagingOutput(outputDirectory);
  const { headers, redirects } = cloudflareMetadata(pages);
  writeFileSync(join(outputDirectory, '_headers'), headers);
  writeFileSync(join(outputDirectory, '_redirects'), redirects);
  console.log(
    `Prepared Cloudflare staging assets: ${pages.length} noindex pages, empty sitemap, safe SkyTab redirect.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 2)
      throw new Error('This command only prepares apps/web/out; arguments are not supported.');
    prepareCloudflare();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
