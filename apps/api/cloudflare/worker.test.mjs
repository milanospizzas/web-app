import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import worker from './worker.mjs';

const baseUrl = 'https://api.example.invalid';

function request(path, method = 'GET', options = {}) {
  return new Request(`${baseUrl}${path}`, { method, ...options });
}

function assertResponseHeaders(response) {
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.equal(response.headers.get('set-cookie'), null);
}

test('health reports the dormant API without claiming live database connections', async () => {
  const before = Date.now();
  const response = worker.fetch(request('/health'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assertResponseHeaders(response);
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
  assert.deepEqual(body.services, { database: 'not_required', redis: 'not_required' });
  assert.deepEqual(body.features, {
    customOrdering: false,
    customPayment: false,
    accounts: false,
  });
  assert.ok(Date.parse(body.timestamp) >= before);
  assert.ok(Date.parse(body.timestamp) <= Date.now());
});

test('HEAD keeps health/not-found status and headers but has no body', async () => {
  for (const [path, status] of [
    ['/health', 200],
    ['/api/orders/test-order', 404],
    ['/health/', 404],
  ]) {
    const response = worker.fetch(request(path, 'HEAD'));
    assert.equal(response.status, status);
    assertResponseHeaders(response);
    assert.equal(response.body, null);
    assert.equal(await response.text(), '');
  }
});

test('only exact health GET/HEAD routes succeed, and CORS preflights stay unavailable', async () => {
  for (const [path, method] of [
    ['/health', 'POST'],
    ['/health', 'PUT'],
    ['/health', 'PATCH'],
    ['/health', 'DELETE'],
    ['/health', 'OPTIONS'],
    ['/health/', 'GET'],
    ['/HEALTH', 'GET'],
    ['/health/extra', 'GET'],
    ['/api/health', 'GET'],
    ['/', 'GET'],
  ]) {
    const response = worker.fetch(
      request(path, method, {
        headers: {
          Origin: 'https://untrusted.example.invalid',
          'Access-Control-Request-Method': 'POST',
        },
      })
    );
    assert.equal(response.status, 404, `${method} ${path}`);
    assertResponseHeaders(response);
    assert.deepEqual(await response.json(), {
      message: `Route ${method}:${path} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
  }
});

test('hostile flags cannot activate account, menu, order, payment, or POS routes', async () => {
  const hostileEnv = {
    CUSTOM_ORDERING_ENABLED: 'true',
    CUSTOM_PAYMENT_ENABLED: 'true',
    ACCOUNTS_ENABLED: 'true',
    DATABASE_URL: 'postgresql://sensitive-user:sensitive-password@db.invalid/private',
    REDIS_URL: 'redis://sensitive-password@redis.invalid',
    SESSION_SECRET: 'sensitive-session-secret',
    SHIFT4_API_KEY: 'sensitive-payment-key',
    SKYTAB_API_SECRET: 'sensitive-pos-secret',
    AWS_SECRET_ACCESS_KEY: 'sensitive-email-secret',
  };

  for (const [path, method] of [
    ['/api/auth/magic-link', 'POST'],
    ['/api/auth/verify', 'GET'],
    ['/api/menu/locations/test-location/menus', 'GET'],
    ['/api/orders', 'POST'],
    ['/api/orders/test-order', 'GET'],
    ['/api/orders/test-order/payment', 'POST'],
    ['/api/pos/skytab/webhook', 'POST'],
    ['/api/pos/skytab/sync-menu', 'POST'],
    ['/api/pos/skytab/send-order', 'POST'],
  ]) {
    const input = request(path, method, {
      headers: { Cookie: 'session_token=sensitive-cookie', Authorization: 'Bearer sensitive-auth' },
      ...(method === 'POST' ? { body: '{"token":"sensitive-body"}' } : {}),
    });
    const response = worker.fetch(input, hostileEnv);
    assert.equal(response.status, 404, `${method} ${path}`);
    assertResponseHeaders(response);
    assert.equal(input.bodyUsed, false);
    assert.doesNotMatch(await response.text(), /sensitive-/);
  }

  const health = worker.fetch(request('/health?token=sensitive-query'), hostileEnv);
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.deepEqual(body.features, {
    customOrdering: false,
    customPayment: false,
    accounts: false,
  });
  assert.doesNotMatch(JSON.stringify(body), /sensitive-/);
});

test('not-found messages omit queries and bound reflected paths', async () => {
  const path = `/missing/${'a'.repeat(4096)}`;
  const response = worker.fetch(request(`${path}?token=sensitive-query`));
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.message, `Route GET:${path.slice(0, 256)} not found`);
  assert.doesNotMatch(JSON.stringify(body), /sensitive-query|token=/);
  assert.ok(JSON.stringify(body).length < 400);
});

test('request handling uses no environment bindings, background work, network, or logs', async (t) => {
  const forbiddenAccess = new Proxy(
    {},
    {
      get(_target, key) {
        assert.fail(`Unexpected environment/context access: ${String(key)}`);
      },
    }
  );
  const fetchSpy = t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Dormant API must not initiate an external request');
  });
  const logSpies = ['log', 'info', 'warn', 'error', 'debug'].map((method) =>
    t.mock.method(console, method, () => {
      assert.fail('Dormant API must not log request data');
    })
  );

  for (const [path, method] of [
    ['/health', 'GET'],
    ['/health', 'HEAD'],
    ['/api/orders/test-order/payment?secret=sensitive-query', 'POST'],
  ]) {
    const response = worker.fetch(request(path, method), forbiddenAccess, forbiddenAccess);
    assert.ok(response instanceof Response);
    await response.text();
  }

  assert.equal(fetchSpy.mock.callCount(), 0);
  for (const spy of logSpies) assert.equal(spy.mock.callCount(), 0);

  // Keep the deployed module dependency-free: imports could bring dormant side effects back.
  const source = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bimport\s*(?:\(|['"{*]|\w)/);
});
