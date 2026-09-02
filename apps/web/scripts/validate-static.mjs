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

const htmlFiles = filesIn(outputDirectory).filter(
  (path) => path.endsWith('.html') && !path.endsWith('404.html'),
);
const titles = new Map();
const descriptions = new Map();

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
  if (page !== 'order.html' && html.includes('online.skytab.com')) {
    errors.push(`${page}: external ordering URL escaped the /order boundary`);
  }
  if (/milanos\.pizza(?:["'/]|$)/i.test(html)) {
    errors.push(`${page}: contains the unapproved legacy domain`);
  }

  titles.set(title, [...(titles.get(title) ?? []), page]);
  descriptions.set(description, [...(descriptions.get(description) ?? []), page]);
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

const orderHtml = readFileSync(join(outputDirectory, 'order.html'), 'utf8');
if (!orderHtml.includes('Open online ordering directly')) {
  errors.push('order.html: missing visible direct-order fallback');
}
if (!orderHtml.includes('\\"mode\\":\\"redirect\\"')) {
  errors.push('order.html: production-safe redirect mode was not serialized');
}

const sitemap = readFileSync(join(outputDirectory, 'sitemap.xml'), 'utf8');
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
