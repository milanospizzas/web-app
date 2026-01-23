import { FastifyInstance } from 'fastify';
import { posService } from './pos.service';
import { skyTabWebhookHandler } from './providers/skytab';
import { authMiddleware, adminMiddleware } from '../../shared/middleware/auth.middleware';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { prisma } from '../../shared/database/prisma';
import { z } from 'zod';
import type { SkyTabWebhookPayload } from '@milanos/shared';

// Validation schemas
const syncMenuSchema = z.object({
  locationId: z.string().min(1),
  fullSync: z.boolean().optional().default(false),
});

const sendOrderSchema = z.object({
  orderId: z.string().min(1),
});

const updateAvailabilitySchema = z.object({
  itemId: z.string().min(1),
  isAvailable: z.boolean(),
});

export async function posRoutes(fastify: FastifyInstance) {
  // ==================== Admin Endpoints ====================

  /**
   * Sync menu from POS
   * POST /api/pos/skytab/sync-menu
   */
  fastify.post(
    '/skytab/sync-menu',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const body = syncMenuSchema.parse(request.body);

        // Create sync log
        const syncLog = await prisma.pOSSyncLog.create({
          data: {
            locationId: body.locationId,
            syncType: body.fullSync ? 'full' : 'incremental',
            status: 'in_progress',
          },
        });

        try {
          const result = await posService.syncMenu(body.locationId);

          // Update sync log with success
          await prisma.pOSSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              itemsSynced: result.itemCount,
              modifiersSynced: result.modifierCount,
            },
          });

          return successResponse(reply, {
            message: 'Menu sync completed successfully',
            syncLogId: syncLog.id,
            itemCount: result.itemCount,
            modifierCount: result.modifierCount,
          });
        } catch (syncError) {
          // Update sync log with failure
          await prisma.pOSSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
              errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error',
            },
          });

          throw syncError;
        }
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_SYNC_ERROR',
          error.message || 'Failed to sync menu',
          500
        );
      }
    }
  );

  /**
   * Send order to POS
   * POST /api/pos/skytab/send-order
   */
  fastify.post(
    '/skytab/send-order',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const body = sendOrderSchema.parse(request.body);

        const result = await posService.sendOrderToPOS(body.orderId);

        return successResponse(reply, {
          message: 'Order sent to POS successfully',
          posOrderId: result.posOrderId,
          success: result.success,
        });
      } catch (error: any) {
        request.log.error(error);

        // Queue for retry if POS is unavailable
        if (error.code === 'SERVICE_UNAVAILABLE' || error.statusCode >= 500) {
          const body = request.body as { orderId: string };
          await queueFailedRequest('order_submit', body.orderId, body, error.message);
        }

        return errorResponse(
          reply,
          'POS_ORDER_ERROR',
          error.message || 'Failed to send order to POS',
          500
        );
      }
    }
  );

  /**
   * Handle POS webhooks
   * POST /api/pos/skytab/webhook
   */
  fastify.post('/skytab/webhook', async (request, reply) => {
    try {
      const rawBody = JSON.stringify(request.body);
      const signature = request.headers['x-skytab-signature'] as string || '';

      // Verify webhook signature
      if (!skyTabWebhookHandler.verifySignature(rawBody, signature)) {
        logger.warn({ signature }, 'Invalid webhook signature');
        return errorResponse(reply, 'INVALID_SIGNATURE', 'Invalid webhook signature', 401);
      }

      const payload = request.body as SkyTabWebhookPayload;

      // Store webhook event for tracking
      await prisma.pOSWebhookEvent.create({
        data: {
          eventId: payload.eventId,
          eventType: payload.eventType,
          locationGuid: payload.locationGuid,
          payload: payload as any,
          status: 'pending',
        },
      });

      // Process webhook asynchronously
      // We respond quickly to avoid timeout, then process in background
      setImmediate(async () => {
        try {
          await skyTabWebhookHandler.processWebhook(payload);

          await prisma.pOSWebhookEvent.update({
            where: { eventId: payload.eventId },
            data: {
              status: 'processed',
              processedAt: new Date(),
            },
          });
        } catch (error) {
          logger.error({ error, eventId: payload.eventId }, 'Webhook processing failed');

          await prisma.pOSWebhookEvent.update({
            where: { eventId: payload.eventId },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              retryCount: { increment: 1 },
            },
          });
        }
      });

      // Respond immediately
      return reply.status(200).send({ received: true });
    } catch (error: any) {
      request.log.error(error);
      // Always return 200 to acknowledge receipt (prevent retries from POS)
      return reply.status(200).send({ received: true, error: 'Processing failed' });
    }
  });

  /**
   * Get POS status and health
   * GET /api/pos/skytab/status
   */
  fastify.get(
    '/skytab/status',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const locationId = request.query as { locationId?: string };

        // Test POS connectivity
        const provider = posService.getProvider('skytab');
        const isConnected = await provider.authenticate();

        // Get recent sync history
        const recentSyncs = await prisma.pOSSyncLog.findMany({
          where: locationId.locationId ? { locationId: locationId.locationId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        // Get pending failed requests
        const pendingRetries = await prisma.pOSFailedRequest.count({
          where: { status: { in: ['pending', 'retrying'] } },
        });

        // Get recent webhook events
        const recentWebhooks = await prisma.pOSWebhookEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            eventId: true,
            eventType: true,
            status: true,
            createdAt: true,
          },
        });

        return successResponse(reply, {
          status: isConnected ? 'connected' : 'disconnected',
          provider: 'skytab',
          lastSync: recentSyncs[0] || null,
          recentSyncs,
          pendingRetries,
          recentWebhooks,
        });
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_STATUS_ERROR',
          error.message || 'Failed to get POS status',
          500
        );
      }
    }
  );

  /**
   * Update item availability (86 an item)
   * POST /api/pos/skytab/availability
   */
  fastify.post(
    '/skytab/availability',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const body = updateAvailabilitySchema.parse(request.body);

        await posService.updateItemAvailability(body.itemId, body.isAvailable);

        return successResponse(reply, {
          message: body.isAvailable
            ? 'Item marked as available'
            : 'Item marked as unavailable (86\'d)',
          itemId: body.itemId,
          isAvailable: body.isAvailable,
        });
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_AVAILABILITY_ERROR',
          error.message || 'Failed to update item availability',
          500
        );
      }
    }
  );

  /**
   * Get unavailable items
   * GET /api/pos/skytab/unavailable
   */
  fastify.get(
    '/skytab/unavailable',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { locationId } = request.query as { locationId: string };

        if (!locationId) {
          return errorResponse(reply, 'VALIDATION_ERROR', 'locationId is required', 400);
        }

        const provider = posService.getProvider('skytab');
        const unavailableItems = await provider.getUnavailableItems(locationId);

        return successResponse(reply, {
          locationId,
          unavailableItems,
          count: unavailableItems.length,
        });
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_UNAVAILABLE_ERROR',
          error.message || 'Failed to get unavailable items',
          500
        );
      }
    }
  );

  /**
   * Retry failed requests
   * POST /api/pos/skytab/retry-failed
   */
  fastify.post(
    '/skytab/retry-failed',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const failedRequests = await prisma.pOSFailedRequest.findMany({
          where: {
            status: { in: ['pending', 'retrying'] },
            retryCount: { lt: prisma.pOSFailedRequest.fields.maxRetries },
            OR: [
              { nextRetryAt: null },
              { nextRetryAt: { lte: new Date() } },
            ],
          },
          take: 10,
        });

        const results = [];

        for (const request of failedRequests) {
          try {
            await prisma.pOSFailedRequest.update({
              where: { id: request.id },
              data: { status: 'retrying' },
            });

            // Retry based on request type
            if (request.requestType === 'order_submit') {
              const payload = request.requestPayload as { orderId: string };
              await posService.sendOrderToPOS(payload.orderId);
            }

            // Mark as completed
            await prisma.pOSFailedRequest.update({
              where: { id: request.id },
              data: {
                status: 'completed',
                completedAt: new Date(),
              },
            });

            results.push({ id: request.id, success: true });
          } catch (retryError) {
            // Update retry count and schedule next retry
            const nextRetryDelay = Math.min(
              1000 * Math.pow(2, request.retryCount + 1),
              30 * 60 * 1000 // Max 30 minutes
            );

            await prisma.pOSFailedRequest.update({
              where: { id: request.id },
              data: {
                status:
                  request.retryCount + 1 >= request.maxRetries ? 'abandoned' : 'pending',
                retryCount: { increment: 1 },
                nextRetryAt: new Date(Date.now() + nextRetryDelay),
                errorMessage: retryError instanceof Error ? retryError.message : 'Unknown error',
              },
            });

            results.push({
              id: request.id,
              success: false,
              error: retryError instanceof Error ? retryError.message : 'Unknown error',
            });
          }
        }

        return successResponse(reply, {
          message: `Processed ${results.length} failed requests`,
          results,
        });
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_RETRY_ERROR',
          error.message || 'Failed to retry failed requests',
          500
        );
      }
    }
  );

  /**
   * Get sync history
   * GET /api/pos/skytab/sync-history
   */
  fastify.get(
    '/skytab/sync-history',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (request, reply) => {
      try {
        const { locationId, limit = 20, offset = 0 } = request.query as {
          locationId?: string;
          limit?: number;
          offset?: number;
        };

        const where = locationId ? { locationId } : {};

        const [syncs, total] = await Promise.all([
          prisma.pOSSyncLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
            include: {
              location: {
                select: { id: true, name: true },
              },
            },
          }),
          prisma.pOSSyncLog.count({ where }),
        ]);

        return successResponse(reply, {
          syncs,
          total,
          limit: Number(limit),
          offset: Number(offset),
        });
      } catch (error: any) {
        request.log.error(error);
        return errorResponse(
          reply,
          'POS_HISTORY_ERROR',
          error.message || 'Failed to get sync history',
          500
        );
      }
    }
  );
}

/**
 * Queue a failed request for retry
 */
async function queueFailedRequest(
  requestType: string,
  locationId: string | null,
  payload: unknown,
  errorMessage: string
): Promise<void> {
  try {
    await prisma.pOSFailedRequest.create({
      data: {
        locationId,
        requestType,
        requestPayload: payload as any,
        errorMessage,
        nextRetryAt: new Date(Date.now() + 60000), // Retry after 1 minute
      },
    });

    logger.info({ requestType, locationId }, 'Failed request queued for retry');
  } catch (error) {
    logger.error({ error, requestType }, 'Failed to queue failed request');
  }
}
