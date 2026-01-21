import { FastifyInstance } from 'fastify';
import { ordersService } from './orders.service';
import { shift4Service } from '../payments/shift4.service';
import { authMiddleware, adminMiddleware } from '../../shared/middleware/auth.middleware';
import { successResponse, errorResponse, paginatedResponse } from '../../shared/utils/response';
import { createOrderSchema, updateOrderStatusSchema, createPaymentSchema } from '@milanos/shared';

export async function ordersRoutes(fastify: FastifyInstance) {
  // Create order
  fastify.post('/', async (request, reply) => {
    try {
      const body = createOrderSchema.parse(request.body);
      const userId = request.user?.id;

      const order = await ordersService.createOrder(userId, body);
      return successResponse(reply, order, 201);
    } catch (error: any) {
      request.log.error(error);
      return errorResponse(reply, 'ORDER_ERROR', error.message || 'Failed to create order', 500);
    }
  });

  // Get order by ID
  fastify.get('/:orderId', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const userId = request.user?.id;

      const order = await ordersService.getOrder(orderId, userId);
      if (!order) {
        return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Order not found', 404);
      }

      return successResponse(reply, order);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch order', 500);
    }
  });

  // Get user's orders
  fastify.get('/user/me', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
      const result = await ordersService.getUserOrders(request.user!.id, page, limit);

      return paginatedResponse(reply, result.orders, result.page, result.limit, result.total);
    } catch (error) {
      request.log.error(error);
      return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch orders', 500);
    }
  });

  // Process payment for order
  fastify.post('/:orderId/payment', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const body = createPaymentSchema.parse(request.body);

      const order = await ordersService.getOrder(orderId);
      if (!order) {
        return errorResponse(reply, 'RESOURCE_NOT_FOUND', 'Order not found', 404);
      }

      if (order.status !== 'pending') {
        return errorResponse(reply, 'ORDER_ERROR', 'Order already processed', 400);
      }

      // Process payment with Shift4
      const paymentResult = await shift4Service.processSale(
        orderId,
        body.amount,
        body.i4goToken
      );

      // Update order status to confirmed
      await ordersService.updateOrderStatus(orderId, 'confirmed', 'Payment received');

      return successResponse(reply, {
        paymentTransactionId: paymentResult.transactionId,
        authCode: paymentResult.authCode,
      });
    } catch (error: any) {
      request.log.error(error);
      return errorResponse(reply, 'PAYMENT_ERROR', error.message || 'Payment processing failed', 500);
    }
  });

  // Cancel order
  fastify.post('/:orderId/cancel', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const { reason } = request.body as { reason?: string };
      const userId = request.user?.id;

      const order = await ordersService.cancelOrder(orderId, userId, reason);
      return successResponse(reply, order);
    } catch (error: any) {
      request.log.error(error);
      return errorResponse(reply, 'ORDER_ERROR', error.message || 'Failed to cancel order', 500);
    }
  });

  // Admin: Update order status
  fastify.patch(
    '/:orderId/status',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { orderId } = request.params as { orderId: string };
        const body = updateOrderStatusSchema.parse(request.body);

        const order = await ordersService.updateOrderStatus(
          orderId,
          body.status,
          body.note,
          request.user!.id
        );

        return successResponse(reply, order);
      } catch (error) {
        request.log.error(error);
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to update order status', 500);
      }
    }
  );

  // Admin: Get orders for location
  fastify.get(
    '/location/:locationId',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { locationId } = request.params as { locationId: string };
        const { status, page = 1, limit = 50 } = request.query as {
          status?: string;
          page?: number;
          limit?: number;
        };

        const result = await ordersService.getLocationOrders(locationId, status, page, limit);
        return paginatedResponse(reply, result.orders, result.page, result.limit, result.total);
      } catch (error) {
        request.log.error(error);
        return errorResponse(reply, 'ORDER_ERROR', 'Failed to fetch location orders', 500);
      }
    }
  );
}
