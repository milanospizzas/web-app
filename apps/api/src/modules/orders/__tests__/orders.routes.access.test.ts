import Fastify from 'fastify';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  getOrderForUser: vi.fn(),
  getUserOrders: vi.fn(),
  cancelOrderForUser: vi.fn(),
  updateOrderStatus: vi.fn(),
  getLocationOrders: vi.fn(),
  processSale: vi.fn(),
  authMiddleware: vi.fn<[FastifyRequest, FastifyReply], Promise<void>>(),
  adminMiddleware: vi.fn<[FastifyRequest, FastifyReply], Promise<void>>(),
}));

vi.mock('../orders.service', () => {
  class OrderCancellationStateError extends Error {}

  return {
    ordersService: mocks,
    OrderCancellationStateError,
  };
});

vi.mock('../../payments/shift4.service', () => ({
  shift4Service: { processSale: mocks.processSale },
}));

vi.mock('../../../shared/middleware/auth.middleware', () => ({
  authMiddleware: mocks.authMiddleware,
  adminMiddleware: mocks.adminMiddleware,
}));

import { ordersRoutes } from '../orders.routes';
import { OrderCancellationStateError } from '../orders.service';

const authenticatedUser = {
  id: 'synthetic-owner-id',
  email: 'owner@example.test',
  isAdmin: false,
};

const validOrderPayload = {
  locationId: 'synthetic-location-id',
  orderType: 'pickup',
  items: [
    {
      menuItemId: 'synthetic-menu-item-id',
      quantity: 1,
      modifiers: [],
    },
  ],
  customerName: 'Synthetic Customer',
  customerEmail: 'customer@example.test',
  customerPhone: '15555550100',
};

const notFoundBody = {
  success: false,
  error: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Order not found',
  },
};

const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ pluginTimeout: 1000 });
  await app.register(ordersRoutes, { prefix: '/api/orders' });
  await app.ready();
  return app;
};

const denyAuthentication = (): void => {
  mocks.authMiddleware.mockImplementation(
    (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      void reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return Promise.resolve();
    }
  );
};

const findForbiddenKey = (value: unknown, forbiddenKeys: ReadonlySet<string>): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenKey(item, forbiddenKeys);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      return key;
    }
    const found = findForbiddenKey(nestedValue, forbiddenKeys);
    if (found) {
      return found;
    }
  }
  return null;
};

beforeEach(() => {
  mocks.authMiddleware.mockImplementation((request: FastifyRequest): Promise<void> => {
    request.user = authenticatedUser;
    return Promise.resolve();
  });
  mocks.adminMiddleware.mockResolvedValue();
  mocks.getUserOrders.mockResolvedValue({ orders: [], page: 1, limit: 20, total: 0 });
  mocks.getLocationOrders.mockResolvedValue({ orders: [], page: 1, limit: 50, total: 0 });
});

describe('ordersRoutes registration and customer authentication', () => {
  it('registers every existing order route without invoking handlers or providers', async () => {
    const app = await buildApp();

    try {
      const routes = [
        { method: 'POST', url: '/api/orders' },
        { method: 'GET', url: '/api/orders/user/me' },
        { method: 'GET', url: '/api/orders/:orderId' },
        { method: 'POST', url: '/api/orders/:orderId/payment' },
        { method: 'POST', url: '/api/orders/:orderId/cancel' },
        { method: 'PATCH', url: '/api/orders/:orderId/status' },
        { method: 'GET', url: '/api/orders/location/:locationId' },
      ] as const;

      for (const route of routes) {
        expect(app.hasRoute(route)).toBe(true);
      }
      expect(mocks.createOrder).not.toHaveBeenCalled();
      expect(mocks.getOrderForUser).not.toHaveBeenCalled();
      expect(mocks.processSale).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('short-circuits every unauthenticated customer route before service or provider calls', async () => {
    denyAuthentication();
    const app = await buildApp();

    try {
      const requests = [
        { method: 'POST' as const, url: '/api/orders', payload: validOrderPayload },
        { method: 'GET' as const, url: '/api/orders/user/me' },
        { method: 'GET' as const, url: '/api/orders/synthetic-order-id' },
        {
          method: 'POST' as const,
          url: '/api/orders/synthetic-order-id/payment',
          payload: {
            orderId: 'synthetic-order-id',
            amount: 25,
            i4goToken: 'synthetic-i4go-value',
          },
        },
        {
          method: 'POST' as const,
          url: '/api/orders/synthetic-order-id/cancel',
          payload: { reason: 'Synthetic cancellation reason' },
        },
      ];

      for (const request of requests) {
        const response = await app.inject(request);
        expect(response.statusCode).toBe(401);
      }

      expect(mocks.createOrder).not.toHaveBeenCalled();
      expect(mocks.getUserOrders).not.toHaveBeenCalled();
      expect(mocks.getOrderForUser).not.toHaveBeenCalled();
      expect(mocks.cancelOrderForUser).not.toHaveBeenCalled();
      expect(mocks.processSale).not.toHaveBeenCalled();
      expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('uses the authenticated owner for creation and ignores a client-supplied owner', async () => {
    const createdOrder = { id: 'synthetic-created-order-id', status: 'pending' };
    mocks.createOrder.mockResolvedValue(createdOrder);
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: { ...validOrderPayload, userId: 'synthetic-foreign-user-id' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ success: true, data: createdOrder });
      expect(mocks.createOrder).toHaveBeenCalledOnce();
      expect(mocks.createOrder).toHaveBeenCalledWith(authenticatedUser.id, validOrderPayload);
    } finally {
      await app.close();
    }
  });

  it('returns 401 instead of creating an unowned order when middleware supplies no user', async () => {
    mocks.authMiddleware.mockResolvedValue();
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: validOrderPayload,
      });

      expect(response.statusCode).toBe(401);
      expect(mocks.createOrder).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});

describe('ordersRoutes customer ownership', () => {
  it('passes both order ID and authenticated user ID for an owned detail response', async () => {
    const ownedOrder = { id: 'synthetic-owned-order-id', status: 'pending' };
    mocks.getOrderForUser.mockResolvedValue(ownedOrder);
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'GET',
        url: `/api/orders/${ownedOrder.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true, data: ownedOrder });
      expect(mocks.getOrderForUser).toHaveBeenCalledWith(ownedOrder.id, authenticatedUser.id);
    } finally {
      await app.close();
    }
  });

  it('uses the same 404 response for a foreign order and a nonexistent order', async () => {
    mocks.getOrderForUser.mockResolvedValue(null);
    const app = await buildApp();

    try {
      const foreignResponse = await app.inject({
        method: 'GET',
        url: '/api/orders/synthetic-foreign-order-id',
      });
      const missingResponse = await app.inject({
        method: 'GET',
        url: '/api/orders/synthetic-missing-order-id',
      });

      expect(foreignResponse.statusCode).toBe(404);
      expect(missingResponse.statusCode).toBe(404);
      expect(foreignResponse.json()).toEqual(notFoundBody);
      expect(missingResponse.json()).toEqual(notFoundBody);
    } finally {
      await app.close();
    }
  });

  it('uses only the authenticated user ID for the static user-order list route', async () => {
    mocks.getUserOrders.mockResolvedValue({ orders: [], page: 2, limit: 5, total: 0 });
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/user/me?page=2&limit=5&userId=synthetic-foreign-user-id',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getUserOrders).toHaveBeenCalledWith(authenticatedUser.id, 2, 5);
      expect(mocks.getOrderForUser).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('serializes safe payment summary fields without forbidden customer keys', async () => {
    const safeOrder = {
      id: 'synthetic-safe-order-id',
      items: [
        {
          id: 'synthetic-item-id',
          menuItem: { id: 'synthetic-menu-item-id', name: 'Synthetic Pizza' },
          modifiers: [
            {
              id: 'synthetic-order-modifier-id',
              modifier: { id: 'synthetic-modifier-id', name: 'Synthetic Topping' },
            },
          ],
        },
      ],
      payments: [
        {
          id: 'synthetic-payment-id',
          transactionType: 'sale',
          status: 'completed',
          amount: '25.00',
          currency: 'USD',
          cardLast4: '1111',
          cardBrand: 'Synthetic Card',
          createdAt: '2026-08-26T00:00:00.000Z',
          updatedAt: '2026-08-26T00:00:00.000Z',
        },
      ],
      statusHistory: [
        {
          id: 'synthetic-status-id',
          status: 'confirmed',
          note: 'Synthetic note',
          createdAt: '2026-08-26T00:00:00.000Z',
        },
      ],
    };
    mocks.getOrderForUser.mockResolvedValue(safeOrder);
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'GET',
        url: `/api/orders/${safeOrder.id}`,
      });
      const body: unknown = response.json();
      const forbiddenKeys = new Set([
        'shift4Token',
        'rawResponse',
        'ipAddress',
        'userAgent',
        'shift4AuthCode',
        'shift4ResponseCode',
        'shift4ResponseMessage',
        'shift4AvsResult',
        'shift4CvvResult',
        'errorMessage',
        'posOrderId',
        'posSyncStatus',
        'posSyncedAt',
        'posErrorMessage',
        'posItemId',
        'posCategoryId',
        'posModifierId',
        'changedBy',
      ]);

      expect(response.statusCode).toBe(200);
      expect(findForbiddenKey(body, forbiddenKeys)).toBeNull();
      expect(body).toEqual({ success: true, data: safeOrder });
    } finally {
      await app.close();
    }
  });
});

describe('ordersRoutes payment and cancellation ownership preconditions', () => {
  it('does not call Shift4 or update status for a foreign payment attempt', async () => {
    mocks.getOrderForUser.mockResolvedValue(null);
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-foreign-order-id/payment',
        payload: {
          orderId: 'synthetic-foreign-order-id',
          amount: 25,
          i4goToken: 'synthetic-i4go-value',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(notFoundBody);
      expect(mocks.getOrderForUser).toHaveBeenCalledWith(
        'synthetic-foreign-order-id',
        authenticatedUser.id
      );
      expect(mocks.processSale).not.toHaveBeenCalled();
      expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('continues the existing payment flow for an owned pending order', async () => {
    mocks.getOrderForUser.mockResolvedValue({
      id: 'synthetic-owned-order-id',
      status: 'pending',
    });
    mocks.processSale.mockResolvedValue({
      transactionId: 'synthetic-transaction-id',
      authCode: 'synthetic-auth-code',
    });
    mocks.updateOrderStatus.mockResolvedValue({});
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-owned-order-id/payment',
        payload: {
          orderId: 'synthetic-owned-order-id',
          amount: 25,
          i4goToken: 'synthetic-i4go-value',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.processSale).toHaveBeenCalledWith(
        'synthetic-owned-order-id',
        25,
        'synthetic-i4go-value'
      );
      expect(mocks.updateOrderStatus).toHaveBeenCalledWith(
        'synthetic-owned-order-id',
        'confirmed',
        'Payment received'
      );
    } finally {
      await app.close();
    }
  });

  it('uses the same 404 response for foreign and nonexistent cancellations', async () => {
    mocks.cancelOrderForUser.mockResolvedValue(null);
    const app = await buildApp();

    try {
      const foreignResponse = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-foreign-order-id/cancel',
        payload: {},
      });
      const missingResponse = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-missing-order-id/cancel',
        payload: {},
      });

      expect(foreignResponse.statusCode).toBe(404);
      expect(missingResponse.statusCode).toBe(404);
      expect(foreignResponse.json()).toEqual(notFoundBody);
      expect(missingResponse.json()).toEqual(notFoundBody);
      expect(mocks.cancelOrderForUser).toHaveBeenNthCalledWith(
        1,
        'synthetic-foreign-order-id',
        authenticatedUser.id,
        undefined
      );
    } finally {
      await app.close();
    }
  });

  it.each(['pending', 'confirmed'])('allows an owned %s order to be cancelled', async (status) => {
    const cancelledOrder = {
      id: `synthetic-${status}-order-id`,
      status: 'cancelled',
    };
    mocks.cancelOrderForUser.mockResolvedValue(cancelledOrder);
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/orders/${cancelledOrder.id}/cancel`,
        payload: { reason: 'Synthetic cancellation reason' },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.cancelOrderForUser).toHaveBeenCalledWith(
        cancelledOrder.id,
        authenticatedUser.id,
        'Synthetic cancellation reason'
      );
    } finally {
      await app.close();
    }
  });

  it('returns a safe 400 response for an invalid cancellation state', async () => {
    mocks.cancelOrderForUser.mockRejectedValue(new OrderCancellationStateError());
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/synthetic-completed-order-id/cancel',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        success: false,
        error: {
          code: 'ORDER_ERROR',
          message: 'Order cannot be cancelled at this stage',
        },
      });
    } finally {
      await app.close();
    }
  });
});

describe('ordersRoutes administrator middleware order', () => {
  it('stops unauthenticated admin requests before administrator authorization', async () => {
    denyAuthentication();
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/orders/synthetic-order-id/status',
        payload: { status: 'confirmed' },
      });

      expect(response.statusCode).toBe(401);
      expect(mocks.adminMiddleware).not.toHaveBeenCalled();
      expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('stops an authenticated non-admin request before the handler', async () => {
    mocks.adminMiddleware.mockImplementation(
      (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        void reply.status(403).send({
          success: false,
          error: { code: 'AUTH_UNAUTHORIZED', message: 'Admin access required' },
        });
        return Promise.resolve();
      }
    );
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/orders/synthetic-order-id/status',
        payload: { status: 'confirmed' },
      });

      expect(response.statusCode).toBe(403);
      expect(mocks.adminMiddleware).toHaveBeenCalledOnce();
      expect(mocks.updateOrderStatus).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('allows an authorized administrator to reach the existing handler boundary', async () => {
    const adminUser = { ...authenticatedUser, isAdmin: true };
    mocks.authMiddleware.mockImplementation((request: FastifyRequest): Promise<void> => {
      request.user = adminUser;
      return Promise.resolve();
    });
    mocks.updateOrderStatus.mockResolvedValue({
      id: 'synthetic-order-id',
      status: 'confirmed',
    });
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/orders/synthetic-order-id/status',
        payload: { status: 'confirmed', note: 'Synthetic admin note' },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateOrderStatus).toHaveBeenCalledWith(
        'synthetic-order-id',
        'confirmed',
        'Synthetic admin note',
        adminUser.id
      );
    } finally {
      await app.close();
    }
  });
});
