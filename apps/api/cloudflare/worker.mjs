/**
 * Preserve the public API's dormant behavior without starting its deferred
 * ordering platform. Environment flags cannot enable routes in this Worker.
 * Existing PostgreSQL data must be preserved separately before host retirement.
 *
 * @satisfies {ExportedHandler}
 */
const worker = {
  fetch(request) {
    const { pathname } = new URL(request.url);
    const isHealth =
      pathname === '/health' && (request.method === 'GET' || request.method === 'HEAD');

    const body = isHealth
      ? {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          mode: 'dormant',
          services: { database: 'not_required', redis: 'not_required' },
          features: { customOrdering: false, customPayment: false, accounts: false },
        }
      : {
          // Queries can contain credentials. Reflect only a bounded pathname.
          message: `Route ${request.method.slice(0, 32)}:${pathname.slice(0, 256)} not found`,
          error: 'Not Found',
          statusCode: 404,
        };

    return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {
      status: isHealth ? 200 : 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

export default worker;
