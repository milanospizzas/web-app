import assert from 'node:assert/strict';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8788');
const remoteHosts = [
  'milanos-pizza-api.bautistajose95.workers.dev',
  'milanos-pizza-api-staging.bautistajose95.workers.dev',
];
assert(
  !base.username &&
    !base.password &&
    base.pathname === '/' &&
    !base.search &&
    !base.hash &&
    ((base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) ||
      (base.protocol === 'https:' && remoteHosts.includes(base.hostname) && !base.port)),
  'API smoke checks require loopback HTTP or an approved Milano Cloudflare API origin.'
);

let checks = 0;
async function request(path, method = 'GET') {
  assert(['GET', 'HEAD', 'OPTIONS'].includes(method), 'Smoke requests must remain read-only.');
  const url = new URL(path, base);
  assert.equal(url.origin, base.origin, 'Smoke requests must remain on the selected origin.');
  const response = await fetch(url, {
    method,
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/json',
      Origin: 'https://untrusted.example.invalid',
      ...(method === 'OPTIONS' ? { 'Access-Control-Request-Method': 'POST' } : {}),
    },
  });
  checks += 1;
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.equal(response.headers.get('access-control-allow-methods'), null);
  return response;
}

async function json(response) {
  assert(response.body, 'JSON response must have a body.');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        assert.fail('Dormant API response exceeded the 16 KiB smoke limit.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

for (const path of ['/health', '/health?token=synthetic-smoke-secret']) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path} must return health.`);
  const body = await json(response);
  assert.deepEqual(Object.keys(body).sort(), [
    'features',
    'mode',
    'services',
    'status',
    'timestamp',
    'version',
  ]);
  assert.equal(body.status, 'ok');
  assert.equal(body.mode, 'dormant');
  assert.equal(body.version, '1.0.0');
  assert(Number.isFinite(Date.parse(body.timestamp)), 'Health timestamp must be valid.');
  assert.deepEqual(body.services, { database: 'not_required', redis: 'not_required' });
  assert.deepEqual(body.features, {
    customOrdering: false,
    customPayment: false,
    accounts: false,
  });
  assert.doesNotMatch(JSON.stringify(body), /synthetic-smoke-secret|DATABASE_URL|SESSION_SECRET/);
}

const healthHead = await request('/health', 'HEAD');
assert.equal(healthHead.status, 200);
assert.equal(await healthHead.text(), '');

// These are GET/HEAD/OPTIONS only. Do not send payment, email, order, or webhook POSTs.
for (const path of [
  '/',
  '/health/',
  '/api/health',
  '/api/auth/magic-link',
  '/api/menu/locations/synthetic-location/menus',
  '/api/orders/synthetic-order',
  '/api/orders/synthetic-order/payment',
  '/api/pos/skytab/webhook',
  '/missing?token=synthetic-smoke-secret',
]) {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    const response = await request(path, method);
    assert.equal(response.status, 404, `${method} ${path} must remain unavailable.`);
    if (method === 'HEAD') {
      assert.equal(await response.text(), '');
      continue;
    }
    assert.deepEqual(await json(response), {
      message: `Route ${method}:${new URL(path, base).pathname} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
  }
}

const healthOptions = await request('/health', 'OPTIONS');
assert.equal(healthOptions.status, 404);
assert.deepEqual(await json(healthOptions), {
  message: 'Route OPTIONS:/health not found',
  error: 'Not Found',
  statusCode: 404,
});

console.log(`Cloudflare dormant API smoke passed: ${checks} read-only requests to ${base.origin}.`);
