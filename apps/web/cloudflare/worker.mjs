/// <reference path="../../../cloudflare-env.d.ts" />

/** @type {ExportedHandler<Cloudflare.Env>} */
export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/network' || pathname === '/network/') {
      return new Response(request.method === 'HEAD' ? null : 'Gone', {
        status: 410,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // No API proxy or server-side application: all other requests use the export.
    return env.ASSETS.fetch(request);
  },
};
