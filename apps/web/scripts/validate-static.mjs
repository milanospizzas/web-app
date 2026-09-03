import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const outputDirectory = resolve(process.cwd(), 'out');
const errors = [];

function filesIn(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const allHtmlFiles = filesIn(outputDirectory).filter((path) => path.endsWith('.html'));
const htmlFiles = allHtmlFiles.filter((path) => !path.endsWith('404.html'));
const titles = new Map();
const descriptions = new Map();

if (htmlFiles.length !== 27) {
  errors.push(`Expected 27 static HTML pages, found ${htmlFiles.length}`);
}

for (const path of htmlFiles) {
  const page = relative(outputDirectory, path).replaceAll('\\', '/');
  const html = readFileSync(path, 'utf8');
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';

  if (h1Count !== 1) errors.push(`${page}: expected one H1, found ${h1Count}`);
  if (!html.includes('rel="canonical"')) errors.push(`${page}: missing canonical link`);
  if (!description) errors.push(`${page}: missing meta description`);
  if (!html.includes('property="og:title"')) errors.push(`${page}: missing Open Graph title`);
  if (!html.includes('name="twitter:title"')) errors.push(`${page}: missing Twitter title`);
  if (!html.includes('OpeningHoursSpecification')) {
    errors.push(`${page}: missing Restaurant JSON-LD`);
  }
  if (page !== 'index.html' && !html.includes('BreadcrumbList')) {
    errors.push(`${page}: missing Breadcrumb JSON-LD`);
  }
  if (/milanos\.pizza(?:["'/]|$)/i.test(html)) {
    errors.push(`${page}: contains the unapproved legacy domain`);
  }

  titles.set(title, [...(titles.get(title) ?? []), page]);
  descriptions.set(description, [...(descriptions.get(description) ?? []), page]);
}

for (const path of allHtmlFiles) {
  const page = relative(outputDirectory, path).replaceAll('\\', '/');
  if (page !== 'order.html' && readFileSync(path, 'utf8').includes('online.skytab.com')) {
    errors.push(`${page}: external ordering URL escaped the /order boundary`);
  }
}

for (const [title, pages] of titles) {
  if (!title) errors.push('At least one page has an empty title');
  if (pages.length > 1) errors.push(`Duplicate title on ${pages.join(', ')}: ${title}`);
}

for (const [description, pages] of descriptions) {
  if (pages.length > 1) {
    errors.push(`Duplicate description on ${pages.join(', ')}: ${description}`);
  }
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'");
}

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=(['"])(.*?)\\1`, 'i'));
  return match ? decodeHtmlAttribute(match[2]) : null;
}

function visibleText(markup) {
  return markup
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const orderHtml = readFileSync(join(outputDirectory, 'order.html'), 'utf8');
const anchors = [...orderHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(
  ([, attributes, contents]) => ({
    attributes,
    text: visibleText(contents),
    href: attributeValue(attributes, 'href'),
    target: attributeValue(attributes, 'target'),
    ariaLabel: attributeValue(attributes, 'aria-label'),
    ariaLabelledBy: attributeValue(attributes, 'aria-labelledby'),
  })
);

function requiredOrderAnchor(label) {
  const matches = anchors.filter((anchor) => anchor.text === label);
  if (matches.length !== 1) {
    errors.push(
      `order.html: expected one native anchor labeled "${label}", found ${matches.length}`
    );
    return null;
  }

  const anchor = matches[0];
  if (!anchor.href) errors.push(`order.html: "${label}" is missing a complete href`);
  if (anchor.target !== null) errors.push(`order.html: "${label}" must use same-tab navigation`);
  if (anchor.ariaLabelledBy !== null) {
    errors.push(`order.html: "${label}" must not have an overriding aria-labelledby`);
  }
  if (anchor.ariaLabel !== null && !anchor.ariaLabel.startsWith(label)) {
    errors.push(`order.html: accessible name for "${label}" must begin with its visible label`);
  }
  return anchor;
}

const primaryOrderAnchor = requiredOrderAnchor('Continue to SkyTab');
const fallbackOrderAnchor = requiredOrderAnchor('Open SkyTab ordering directly');
const approvedDestination = new URL('https://online.skytab.com/29f9af1c8689260fadade27c64cb9e55');
approvedDestination.searchParams.set('source', 'direct');

for (const anchor of [primaryOrderAnchor, fallbackOrderAnchor]) {
  if (!anchor?.href) continue;
  try {
    const destination = new URL(anchor.href);
    if (destination.toString() !== approvedDestination.toString()) {
      errors.push(
        `order.html: "${anchor.text}" must use only the approved SkyTab destination and source`
      );
    }
  } catch {
    errors.push(`order.html: "${anchor.text}" has an invalid href`);
  }
}

if (
  primaryOrderAnchor?.href &&
  fallbackOrderAnchor?.href &&
  primaryOrderAnchor.href !== fallbackOrderAnchor.href
) {
  errors.push('order.html: primary and fallback SkyTab destinations must match');
}

const orderPageText = visibleText(orderHtml);
if (
  !/You(?:’|')ll leave Milano(?:’|')s website and continue to SkyTab, our online ordering provider, to view the current menu and place your order\./.test(
    orderPageText
  )
) {
  errors.push('order.html: missing visible SkyTab handoff disclosure');
}
if (/configured online ordering provider/i.test(orderHtml)) {
  errors.push('order.html: contains stale generic-provider wording');
}
if (orderHtml.includes('Continue to Order')) {
  errors.push('order.html: contains stale primary-action wording');
}
if (/Opening secure ordering(?:…|\.\.\.)/i.test(orderHtml)) {
  errors.push('order.html: contains stale redirect status wording');
}
if (!orderHtml.includes('\\"mode\\":\\"redirect\\"')) {
  errors.push('order.html: production-safe redirect mode was not serialized');
}
if (
  orderHtml.includes('\\"mode\\":\\"iframe\\"') ||
  orderHtml.includes('\\"iframeEnabled\\":true') ||
  /<iframe\b/i.test(orderHtml)
) {
  errors.push('order.html: active iframe mode must not be serialized');
}

const sitemap = readFileSync(join(outputDirectory, 'sitemap.xml'), 'utf8');
const robots = readFileSync(join(outputDirectory, 'robots.txt'), 'utf8');
const noIndexPageCount = htmlFiles.filter((path) =>
  /<meta name="robots" content="[^"]*noindex/i.test(readFileSync(path, 'utf8'))
).length;
const indexablePageCount = htmlFiles.length - noIndexPageCount;
const sitemapLocationCount = (sitemap.match(/<loc>/g) ?? []).length;
const isStagingOutput = /^Disallow:\s*\/\s*$/m.test(robots);

if (isStagingOutput) {
  if (noIndexPageCount !== 27 || indexablePageCount !== 0) {
    errors.push(
      `Staging output must have 27 noindex pages and 0 indexable pages; found ${noIndexPageCount} and ${indexablePageCount}`
    );
  }
  if (sitemapLocationCount !== 0) {
    errors.push(`Staging sitemap must have 0 locations, found ${sitemapLocationCount}`);
  }
  if (/^Sitemap:/m.test(robots)) {
    errors.push('Staging robots.txt must not advertise a sitemap');
  }
} else {
  if (noIndexPageCount !== 16 || indexablePageCount !== 11) {
    errors.push(
      `Production output must have 16 noindex pages and 11 indexable pages; found ${noIndexPageCount} and ${indexablePageCount}`
    );
  }
  if (sitemapLocationCount !== 11) {
    errors.push(`Production sitemap must have 11 locations, found ${sitemapLocationCount}`);
  }
  if (!/^Allow:\s*\/\s*$/m.test(robots)) {
    errors.push('Production robots.txt must allow the public site');
  }
  if (!robots.includes('Host: https://www.milanospizzas.com')) {
    errors.push('Production robots.txt is missing the approved host');
  }
  if (!robots.includes('Sitemap: https://www.milanospizzas.com/sitemap.xml')) {
    errors.push('Production robots.txt is missing the canonical sitemap');
  }
}

for (const excluded of ['/privacy', '/terms', '/network']) {
  if (sitemap.includes(`<loc>https://www.milanospizzas.com${excluded}</loc>`)) {
    errors.push(`sitemap.xml: draft/removed route ${excluded} must be excluded`);
  }
}

for (const path of htmlFiles) {
  const page = relative(outputDirectory, path).replaceAll('\\', '/');
  const html = readFileSync(path, 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const noIndex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  if (!canonical) continue;

  const normalizedCanonical = new URL(canonical).toString();
  const listed = sitemap.includes(`<loc>${normalizedCanonical}</loc>`);
  if (noIndex && listed) {
    errors.push(`sitemap.xml: noindex page ${page} must be excluded`);
  }
  if (!noIndex && !listed) {
    errors.push(`sitemap.xml: indexable page ${page} must be included`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} static HTML pages.`);
