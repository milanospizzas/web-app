import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ordersService, OrderCancellationStateError } from './orders.service';
import { shift4Service } from '../payments/shift4.service';
import { authMiddleware, adminMiddleware } from '../../shared/middleware/auth.middleware';
import { successResponse, errorResponse, paginatedResponse } from '../../shared/utils/response';
import { createOrderSchema, updateOrderStatusSchema, createPaymentSchema } from '@milanos/shared';

interface OrderParams {
  orderId: string;
}

interface LocationParams {
  locationId: string;
}

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const locationOrdersQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

const cancelOrderBodySchema = z.object({
  reason: z.string().optional(),
});

const requireAuthenticatedUserId = (
  request: FastifyRequest,
  reply: FastifyReply
): string | undefined => {
  const userId = request.user?.id;
  if (!userId) {
    void reply.status(401).send({
      success: false,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  return userId;
};

const logRouteError = (request: FastifyRequest, error: unknown, message: string): void => {
  request.log.error({ errorType: error instanceof Error ? error.name : 'UnknownError' }, message);
};

export const ordersRoutes: FastifyPluginCallback = (fastify, _options, done) => {
  const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authMiddleware(request, reply);
  };

  const authorizeAdmin = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await adminMiddleware(request, reply);
  };

  // Create order
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = requireAuthenticatedUserId(request, reply);
    if (!userId) {
      return;
    }

    try {
      const body = createOrderSchema.parse(request.body);
      const order = await ordersService.createOrder(userId, body);
      return successResponse(reply, order, 201);
    } catch (error: unknown) {
      logRouteError(request, error, 'Order creation failed');
      return errorResponse(reply, 'ORDER_ERROR', 'Failed to create order', 500);
    }
  });

  // Get user's orders
  fastify.get('/user/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = requireAuthenticatedUserId(request, reply);
    if (!userId) {
      return;
    }

    try {
      const { page, limit } = paginationQuerySchema.parse(request.query);
      const result = await ordersService.getUserOrders(userId, page, limit);
      return paginatedResponse(reply, result.orders, result.page, result.limit, result.total);
    } catch (error: unknown) {
      logRouteError(request, error, 'Order list lookup failed');
      return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch orders', 500);
    }
  });

  // Get order by ID
  fastify.get<{ Params: OrderParams }>(
    '/:orderId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      try {
        const order = await ordersService.getOrderForUser(request.params.orderId, userId);
        if (!order) {
          return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Order not found', 404);
        }

        return successResponse(reply, order);
      } catch (error: unknown) {
        logRouteError(request, error, 'Order detail lookup failed');
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch order', 500);
      }
    }
  );

  // Process payment for order
  fastify.post<{ Params: OrderParams }>(
    '/:orderId/payment',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      try {
        const { orderId } = request.params;
        const body = createPaymentSchema.parse(request.body);
        const order = await ordersService.getOrderForUser(orderId, userId);
        if (!order) {
          return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Order not found', 404);
        }

        if (order.status !== 'pending') {
          return errorResponse(reply, 'ORDER_ERROR', 'Order already processed', 400);
        }

        // Process payment with Shift4
        const paymentResult = await shift4Service.processSale(orderId, body.amount, body.i4goToken);

        // Update order status to confirmed
        await ordersService.updateOrderStatus(orderId, 'confirmed', 'Payment received');

        return successResponse(reply, {
          paymentTransactionId: paymentResult.transactionId,
          authCode: paymentResult.authCode,
        });
      } catch (error: unknown) {
        logRouteError(request, error, 'Order payment processing failed');
        return errorResponse(reply, 'PAYMENT_ERROR', 'Payment processing failed', 500);
      }
    }
  );

  // Cancel order
  fastify.post<{ Params: OrderParams }>(
    '/:orderId/cancel',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      try {
        const { reason } = cancelOrderBodySchema.parse(request.body ?? {});
        const order = await ordersService.cancelOrderForUser(
          request.params.orderId,
          userId,
          reason
        );
        if (!order) {
          return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Order not found', 404);
        }
        return successResponse(reply, order);
      } catch (error: unknown) {
        logRouteError(request, error, 'Order cancellation failed');
        if (error instanceof OrderCancellationStateError) {
          return errorResponse(
            reply,
            'ORDER_ERROR',
            'Order cannot be cancelled at this stage',
            400
          );
        }
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to cancel order', 500);
      }
    }
  );

  // Admin: Update order status
  fastify.patch<{ Params: OrderParams }>(
    '/:orderId/status',
    { preHandler: [authenticate, authorizeAdmin] },
    async (request, reply) => {
      try {
        const userId = requireAuthenticatedUserId(request, reply);
        if (!userId) {
          return;
        }
        const body = updateOrderStatusSchema.parse(request.body);

        const order = await ordersService.updateOrderStatus(
          request.params.orderId,
          body.status,
          body.note,
          userId
        );

        return successResponse(reply, order);
      } catch (error: unknown) {
        logRouteError(request, error, 'Administrator order status update failed');
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to update order status', 500);
      }
    }
  );

  // Admin: Get orders for location
  fastify.get<{ Params: LocationParams }>(
    '/location/:locationId',
    { preHandler: [authenticate, authorizeAdmin] },
    async (request, reply) => {
      try {
        const { status, page, limit } = locationOrdersQuerySchema.parse(request.query);
        const result = await ordersService.getLocationOrders(
          request.params.locationId,
          status,
          page,
          limit
        );
        return paginatedResponse(reply, result.orders, result.page, result.limit, result.total);
      } catch (error: unknown) {
        logRouteError(request, error, 'Administrator location order lookup failed');
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch location orders', 500);
      }
    }
  );

  done();
};
