import type { FastifyPluginCallback } from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { config } from './config';
import { buildApp } from './app';

const paymentMocks = vi.hoisted(() => ({ processSale: vi.fn() }));

vi.mock('./modules/payments/shift4.service', () => ({
  shift4Service: { processSale: paymentMocks.processSale },
}));

const syntheticOrdersRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post('/:orderId/payment', async () => ({ success: true }));
  done();
};

const syntheticPosRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get('/synthetic-status', async () => ({ enabled: true }));
  done();
};

describe('custom ordering and payment registration gate', () => {
  it('defaults both custom ordering flags to false', () => {
    expect(config.CUSTOM_ORDERING_ENABLED).toBe(false);
    expect(config.CUSTOM_PAYMENT_ENABLED).toBe(false);
  });

  it('does not load or register custom order/payment routes while disabled', async () => {
    const loadOrdersRoutes = vi.fn(async () => ({ ordersRoutes: syntheticOrdersRoutes }));
    const loadPosRoutes = vi.fn(async () => ({ posRoutes: syntheticPosRoutes }));
    const app = await buildApp({
      customOrderingEnabled: false,
      customPaymentEnabled: false,
      loadOrdersRoutes,
      loadPosRoutes,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-order-id/payment',
        payload: {
          orderId: 'synthetic-order-id',
          amount: 25,
          i4goToken: 'synthetic-token-that-must-not-be-processed',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(loadOrdersRoutes).not.toHaveBeenCalled();
      expect(loadPosRoutes).not.toHaveBeenCalled();
      expect(paymentMocks.processSale).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('does not register dormant POS routes while custom ordering is disabled', async () => {
    const loadPosRoutes = vi.fn(async () => ({ posRoutes: syntheticPosRoutes }));
    const app = await buildApp({
      customOrderingEnabled: false,
      customPaymentEnabled: false,
      loadPosRoutes,
    });

    try {
      const response = await app.inject({ method: 'GET', url: '/api/pos/synthetic-status' });

      expect(response.statusCode).toBe(404);
      expect(loadPosRoutes).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('restores POS registration with custom ordering alone while payment stays disabled', async () => {
    const loadPosRoutes = vi.fn(async () => ({ posRoutes: syntheticPosRoutes }));
    const loadOrdersRoutes = vi.fn(async () => ({ ordersRoutes: syntheticOrdersRoutes }));
    const app = await buildApp({
      customOrderingEnabled: true,
      customPaymentEnabled: false,
      loadPosRoutes,
      loadOrdersRoutes,
    });

    try {
      const posResponse = await app.inject({ method: 'GET', url: '/api/pos/synthetic-status' });
      const paymentResponse = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-order-id/payment',
      });

      expect(posResponse.statusCode).toBe(200);
      expect(paymentResponse.statusCode).toBe(404);
      expect(loadPosRoutes).toHaveBeenCalledOnce();
      expect(loadOrdersRoutes).not.toHaveBeenCalled();
      expect(paymentMocks.processSale).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('fails closed when only one custom flag is enabled', async () => {
    const loadOrdersRoutes = vi.fn(async () => ({ ordersRoutes: syntheticOrdersRoutes }));
    const app = await buildApp({
      customOrderingEnabled: true,
      customPaymentEnabled: false,
      loadOrdersRoutes,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-order-id/payment',
      });

      expect(response.statusCode).toBe(404);
      expect(loadOrdersRoutes).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('restores registration only when both flags are explicitly enabled', async () => {
    const paymentRouteReached = vi.fn();
    const isolatedRoutes: FastifyPluginCallback = (app, _options, done) => {
      app.post('/:orderId/payment', async () => {
        paymentRouteReached();
        return { success: true };
      });
      done();
    };
    const loadOrdersRoutes = vi.fn(async () => ({ ordersRoutes: isolatedRoutes }));
    const app = await buildApp({
      customOrderingEnabled: true,
      customPaymentEnabled: true,
      loadOrdersRoutes,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-order-id/payment',
      });

      expect(response.statusCode).toBe(200);
      expect(loadOrdersRoutes).toHaveBeenCalledOnce();
      expect(paymentRouteReached).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it('restores the existing dormant route module only in an isolated enabled app', async () => {
    const app = await buildApp({
      customOrderingEnabled: true,
      customPaymentEnabled: true,
    });

    try {
      expect(
        app.hasRoute({
          method: 'POST',
          url: '/api/orders/:orderId/payment',
        })
      ).toBe(true);
      expect(paymentMocks.processSale).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
