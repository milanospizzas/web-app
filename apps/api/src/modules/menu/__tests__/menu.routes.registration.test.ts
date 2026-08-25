import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { menuRoutes } from '../menu.routes';

describe('menuRoutes registration', () => {
  it('completes registration and exposes the menu routes', async () => {
    const app = Fastify({ pluginTimeout: 1000 });

    try {
      await app.register(menuRoutes, { prefix: '/api/menu' });
      await app.ready();

      expect(
        app.hasRoute({ method: 'GET', url: '/api/menu/locations/:locationId/menus' })
      ).toBe(true);
    } finally {
      await app.close();
    }
  });
});
