import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import {
  assertStagingFiles,
  assertStagingOutput,
  approvedStorefront,
  cloudflareMetadata,
} from './prepare-cloudflare.mjs';
import { stagingEnvironment } from './build-cloudflare.mjs';

function fixture() {
  const files = new Map();
  const page = '<meta name="robots" content="noindex, nofollow, nocache">';
  files.set('index.html', page);
  files.set('menu/pizza.html', page);
  files.set(
    'order.html',
    page +
      `<script>self.__next_f.push([1,"{\\"provider\\":\\"skytab\\",\\"mode\\":\\"redirect\\",\\"checkoutUrl\\":\\"${approvedStorefront}\\",\\"iframeEnabled\\":false}"])</script>` +
      `<a href="${approvedStorefront}?source=direct">Continue to SkyTab</a>` +
      `<a href="${approvedStorefront}?source=direct">Open SkyTab ordering directly</a>`
  );
  for (let index = 0; index < 24; index++) files.set(`page-${index}.html`, page);
  files.set('404.html', page);
  files.set('robots.txt', 'User-agent: *\nDisallow: /\n');
  files.set(
    'sitemap.xml',
    '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
  );
  return files;
}

test('accepts staging export and generates exact route redirects without caching images forever', () => {
  const pages = assertStagingFiles(fixture());
  const { headers, redirects } = cloudflareMetadata(pages);
  assert.equal(pages.length, 27);
  assert.match(headers, /X-Robots-Tag: noindex, nofollow/);
  assert.match(
    headers,
    /\/_next\/static\/\*\n  Cache-Control: public, max-age=31536000, immutable/
  );
  assert.doesNotMatch(headers, /\/images\/\*/);
  assert.match(redirects, /^\/menu\/pizza\/ \/menu\/pizza 301$/m);
  assert.equal(redirects.split('\n').filter((line) => line.endsWith(' 301')).length, 26);
  assert.doesNotMatch(redirects, /\*|^\/404\/|^\/\//m);
});

test('rejects production output before metadata could be written', () => {
  const files = fixture();
  files.set('index.html', '<meta name="robots" content="index, follow">');
  files.set('robots.txt', 'User-agent: *\nAllow: /\n');
  files.set('sitemap.xml', '<urlset><url><loc>https://www.milanospizzas.com/</loc></url></urlset>');
  assert.throws(() => assertStagingFiles(files), /staging requires noindex, nofollow/);
});

test('rejects missing exports and crawler exceptions, including a missing output directory', () => {
  const files = fixture();
  files.delete('menu/pizza.html');
  assert.throws(() => assertStagingFiles(files), /Expected 27 public pages/);
  const exception = fixture();
  exception.set('robots.txt', 'User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\n');
  assert.throws(() => assertStagingFiles(exception), /expected only User-agent/);
  assert.throws(
    () => assertStagingOutput(resolve('missing-cloudflare-output-directory')),
    /ENOENT/
  );
});

test('rejects an altered storefront, iframe mode, new-tab handoff, and leaked external ordering URLs', () => {
  for (const change of [
    (html) => html.replaceAll(approvedStorefront, 'https://online.skytab.com/wrong-store'),
    (html) => html.replace('\\"mode\\":\\"redirect\\"', '\\"mode\\":\\"iframe\\"'),
    (html) => html.replace('<a href=', '<a target="_blank" href='),
  ]) {
    const files = fixture();
    files.set('order.html', change(files.get('order.html')));
    assert.throws(() => assertStagingFiles(files), /Cloudflare staging guard failed/);
  }
  const files = fixture();
  files.set('index.html', files.get('index.html') + `<a href="${approvedStorefront}">Order</a>`);
  assert.throws(() => assertStagingFiles(files), /escaped the \/order boundary/);
});

test('overrides hostile inherited configuration without changing the caller environment', () => {
  const hostile = {
    SITE_ENV: 'production',
    ORDER_PROVIDER: 'custom',
    ORDER_MODE: 'iframe',
    SKYTAB_ORDER_URL: 'https://example.com',
    SKYTAB_IFRAME_ENABLED: 'true',
    CUSTOM_ORDERING_ENABLED: 'true',
    CUSTOM_PAYMENT_ENABLED: 'true',
    ACCOUNTS_ENABLED: 'true',
    ANALYTICS_ENABLED: 'true',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST',
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: 'test',
    GOOGLE_REVIEW_URL: 'https://google.com/review',
    SPECIALS_ENABLED: 'true',
    LOYALTY_ENABLED: 'true',
    MARKETING_SIGNUP_ENABLED: 'true',
    MARKETING_SIGNUP_DESTINATION: 'https://example.com/form',
    MARKETING_CONSENT_TEXT: 'test',
    MARKETING_UNSUBSCRIBE_CONFIGURED: 'true',
    PRIVACY_COPY_APPROVED: 'true',
    X_ENABLED: 'true',
  };
  const env = stagingEnvironment(hostile);
  assert.equal(hostile.SITE_ENV, 'production');
  assert.equal(env.SITE_ENV, 'staging');
  assert.equal(env.ORDER_PROVIDER, 'skytab');
  assert.equal(env.ORDER_MODE, 'redirect');
  assert.equal(env.SKYTAB_ORDER_URL, approvedStorefront);
  for (const key of Object.keys(hostile).filter((name) =>
    /_ENABLED$|_CONFIGURED$|_APPROVED$/.test(name)
  )) {
    assert.equal(env[key], 'false', key);
  }
  for (const key of [
    'GOOGLE_REVIEW_URL',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION',
    'MARKETING_SIGNUP_DESTINATION',
    'MARKETING_CONSENT_TEXT',
  ])
    assert.equal(env[key], '', key);
});
