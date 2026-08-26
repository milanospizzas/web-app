import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyMagicLink: vi.fn(),
  sendMagicLink: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  authMiddleware: vi.fn<[FastifyRequest, FastifyReply], Promise<void>>(),
}));

vi.mock('../auth.service', () => ({ authService: mocks }));

vi.mock('../../../shared/middleware/auth.middleware', () => ({
  authMiddleware: mocks.authMiddleware,
}));

import { authRoutes } from '../auth.routes';

describe('authRoutes', () => {
  it('registers all authentication routes without invoking handlers', async () => {
    const app = Fastify({ pluginTimeout: 1000 });

    try {
      await app.register(cookie);
      await app.register(authRoutes, { prefix: '/api/auth' });
      await app.ready();

      expect(app.hasRoute({ method: 'POST', url: '/api/auth/magic-link' })).toBe(true);
      expect(app.hasRoute({ method: 'POST', url: '/api/auth/verify' })).toBe(true);
      expect(app.hasRoute({ method: 'POST', url: '/api/auth/logout' })).toBe(true);
      expect(app.hasRoute({ method: 'GET', url: '/api/auth/me' })).toBe(true);
      expect(app.hasRoute({ method: 'PATCH', url: '/api/auth/profile' })).toBe(true);
      expect(mocks.verifyMagicLink).not.toHaveBeenCalled();
      expect(mocks.sendMagicLink).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('sets the raw credential only in an HttpOnly cookie and returns safe metadata', async () => {
    const app = Fastify({ pluginTimeout: 1000 });
    const sessionToken = 'synthetic-raw-session-credential';
    const expiresAt = new Date('2026-09-24T12:00:00.000Z');
    mocks.verifyMagicLink.mockResolvedValue({
      user: { id: 'synthetic-user-id', email: 'user@example.test', isAdmin: false },
      sessionToken,
      session: { id: 'synthetic-session-id', expiresAt },
    });

    try {
      await app.register(cookie);
      await app.register(authRoutes, { prefix: '/api/auth' });
      await app.ready();

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/verify',
        payload: { token: 'synthetic-magic-link-credential' },
      });
      const body: unknown = response.json();
      const serializedBody = JSON.stringify(body);

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toContain('session_token=');
      expect(response.headers['set-cookie']).toContain('HttpOnly');
      expect(serializedBody).not.toContain(sessionToken);
      expect(body).toEqual({
        success: true,
        data: {
          user: { id: 'synthetic-user-id', email: 'user@example.test', isAdmin: false },
          session: { id: 'synthetic-session-id', expiresAt: expiresAt.toISOString() },
        },
      });
      expect(Object.keys((body as { data: { session: object } }).data.session)).not.toContain(
        'token'
      );
    } finally {
      await app.close();
    }
  });

  it('short-circuits a protected route after an unauthorized response', async () => {
    const app = Fastify({ pluginTimeout: 1000 });
    mocks.authMiddleware.mockImplementation((_request: FastifyRequest, reply: FastifyReply) => {
      void reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return Promise.resolve();
    });

    try {
      await app.register(cookie);
      await app.register(authRoutes, { prefix: '/api/auth' });
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/api/auth/me' });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(mocks.authMiddleware).toHaveBeenCalledOnce();
      expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('continues a protected route after authentication populates request.user', async () => {
    const app = Fastify({ pluginTimeout: 1000 });
    const authenticatedUser = {
      id: 'synthetic-authenticated-user-id',
      email: 'authenticated@example.test',
      isAdmin: false,
    };
    const currentUser = { ...authenticatedUser, firstName: 'Synthetic' };
    mocks.authMiddleware.mockImplementation((request: FastifyRequest) => {
      request.user = authenticatedUser;
      return Promise.resolve();
    });
    mocks.getCurrentUser.mockResolvedValue(currentUser);

    try {
      await app.register(cookie);
      await app.register(authRoutes, { prefix: '/api/auth' });
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/api/auth/me' });

      expect(response.statusCode).toBe(200);
      expect(mocks.getCurrentUser).toHaveBeenCalledOnce();
      expect(mocks.getCurrentUser).toHaveBeenCalledWith(authenticatedUser.id);
      expect(response.json()).toEqual({ success: true, data: currentUser });
    } finally {
      await app.close();
    }
  });
});
