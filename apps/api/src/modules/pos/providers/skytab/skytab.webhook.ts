import crypto from 'crypto';
import { config } from '../../../../config';
import { logger } from '../../../../shared/utils/logger';
import { prisma } from '../../../../shared/database/prisma';
import type {
  SkyTabWebhookPayload,
  SkyTabWebhookEventType,
  SkyTabTicketWebhookData,
  SkyTabMenuWebhookData,
  SkyTabStockWebhookData,
  SkyTabTicketStatus,
} from '@milanos/shared';

/**
 * SkyTab Webhook Handler
 * Processes incoming webhooks from SkyTab POS for real-time updates
 */
export class SkyTabWebhookHandler {
  /**
   * Verify webhook signature to ensure authenticity
   */
  verifySignature(payload: string, signature: string): boolean {
    const webhookSecret = config.SKYTAB_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('SkyTab webhook secret not configured, skipping signature verification');
      return true; // Allow in development, but log warning
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      logger.error({ error }, 'Error verifying webhook signature');
      return false;
    }
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(payload: SkyTabWebhookPayload): Promise<{
    success: boolean;
    message: string;
  }> {
    const { eventType, eventId, locationGuid, data } = payload;

    logger.info({ eventType, eventId, locationGuid }, 'Processing SkyTab webhook');

    try {
      // Check for duplicate event (idempotency)
      const existingEvent = await this.checkDuplicateEvent(eventId);
      if (existingEvent) {
        logger.info({ eventId }, 'Duplicate webhook event, skipping');
        return { success: true, message: 'Event already processed' };
      }

      // Route to appropriate handler
      switch (eventType) {
        case 'ticket.created':
        case 'ticket.updated':
        case 'ticket.status_changed':
          await this.handleTicketEvent(eventType, data as SkyTabTicketWebhookData);
          break;

        case 'ticket.cancelled':
          await this.handleTicketCancelled(data as SkyTabTicketWebhookData);
          break;

        case 'menu.updated':
        case 'menu.item_availability_changed':
          await this.handleMenuEvent(eventType, data as SkyTabMenuWebhookData, locationGuid);
          break;

        case 'stock.updated':
          await this.handleStockEvent(data as SkyTabStockWebhookData, locationGuid);
          break;

        case 'location.hours_changed':
          await this.handleLocationEvent(locationGuid);
          break;

        default:
          logger.warn({ eventType }, 'Unknown webhook event type');
      }

      // Record successful processing
      await this.recordWebhookEvent(eventId, eventType, locationGuid, 'processed');

      return { success: true, message: `Event ${eventType} processed successfully` };
    } catch (error) {
      logger.error({ error, eventType, eventId }, 'Failed to process webhook');

      // Record failed processing
      await this.recordWebhookEvent(
        eventId,
        eventType,
        locationGuid,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  /**
   * Handle ticket/order events
   */
  private async handleTicketEvent(
    eventType: SkyTabWebhookEventType,
    data: SkyTabTicketWebhookData
  ): Promise<void> {
    const { ticketGuid, externalReference, status, estimatedReadyTime } = data;

    logger.info(
      { eventType, ticketGuid, externalReference, status },
      'Processing ticket event'
    );

    // Find the order by POS order ID or external reference
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ posOrderId: ticketGuid }, { id: externalReference }],
      },
    });

    if (!order) {
      logger.warn({ ticketGuid, externalReference }, 'Order not found for ticket event');
      return;
    }

    // Map SkyTab status to our status
    const newStatus = this.mapSkyTabStatusToOrderStatus(status);

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        posOrderId: ticketGuid,
        posSyncStatus: 'synced',
        posSyncedAt: new Date(),
        estimatedReadyAt: estimatedReadyTime ? new Date(estimatedReadyTime) : undefined,
      },
    });

    // Add status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: newStatus,
        note: `Status updated from SkyTab POS: ${status}`,
        changedBy: 'system',
      },
    });

    logger.info(
      { orderId: order.id, oldStatus: order.status, newStatus },
      'Order status updated from SkyTab'
    );
  }

  /**
   * Handle ticket cancellation
   */
  private async handleTicketCancelled(data: SkyTabTicketWebhookData): Promise<void> {
    const { ticketGuid, externalReference, cancellationReason } = data;

    logger.info({ ticketGuid, externalReference }, 'Processing ticket cancellation');

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ posOrderId: ticketGuid }, { id: externalReference }],
      },
    });

    if (!order) {
      logger.warn({ ticketGuid }, 'Order not found for cancellation');
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        posSyncStatus: 'synced',
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'cancelled',
        note: `Cancelled from SkyTab POS${cancellationReason ? `: ${cancellationReason}` : ''}`,
        changedBy: 'system',
      },
    });

    logger.info({ orderId: order.id }, 'Order cancelled from SkyTab');
  }

  /**
   * Handle menu update events
   */
  private async handleMenuEvent(
    eventType: SkyTabWebhookEventType,
    data: SkyTabMenuWebhookData,
    locationGuid: string
  ): Promise<void> {
    logger.info(
      { eventType, locationGuid, changedItems: data.changedItems?.length || 0 },
      'Processing menu event'
    );

    // Find location by POS location ID
    const location = await prisma.location.findFirst({
      where: { posLocationId: locationGuid },
    });

    if (!location) {
      logger.warn({ locationGuid }, 'Location not found for menu event');
      return;
    }

    // Mark menu as needing sync
    await prisma.menu.updateMany({
      where: { locationId: location.id },
      data: { lastSyncAt: null }, // Setting to null indicates sync needed
    });

    // If specific items changed, we could update just those
    if (data.changedItems && data.changedItems.length > 0) {
      logger.info(
        { locationId: location.id, itemCount: data.changedItems.length },
        'Menu items changed, triggering incremental sync'
      );

      // Mark specific items for update (they'll be synced on next menu sync)
      await prisma.menuItem.updateMany({
        where: {
          posItemId: { in: data.changedItems },
        },
        data: {
          updatedAt: new Date(), // Touch timestamp to indicate change pending
        },
      });
    }

    logger.info({ locationId: location.id }, 'Menu sync flag set from webhook');
  }

  /**
   * Handle stock/inventory update events
   */
  private async handleStockEvent(
    data: SkyTabStockWebhookData,
    locationGuid: string
  ): Promise<void> {
    logger.info(
      { locationGuid, itemCount: data.items.length },
      'Processing stock event'
    );

    for (const item of data.items) {
      try {
        // Find menu item by POS item ID
        const menuItem = await prisma.menuItem.findFirst({
          where: { posItemId: item.itemGuid },
        });

        if (!menuItem) {
          logger.debug({ itemGuid: item.itemGuid }, 'Menu item not found for stock update');
          continue;
        }

        // Update availability (86 status)
        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: {
            is86ed: !item.isAvailable,
            isAvailable: item.isAvailable,
          },
        });

        logger.info(
          { itemId: menuItem.id, isAvailable: item.isAvailable },
          `Item ${item.isAvailable ? 'un-86\'d' : '86\'d'} from SkyTab`
        );
      } catch (error) {
        logger.error({ error, itemGuid: item.itemGuid }, 'Failed to update item stock');
      }
    }
  }

  /**
   * Handle location hours change events
   */
  private async handleLocationEvent(locationGuid: string): Promise<void> {
    logger.info({ locationGuid }, 'Processing location hours change event');

    // Find location by POS location ID
    const location = await prisma.location.findFirst({
      where: { posLocationId: locationGuid },
    });

    if (!location) {
      logger.warn({ locationGuid }, 'Location not found for hours change event');
      return;
    }

    // Log the event - actual hours sync would happen on next fetch
    await prisma.auditLog.create({
      data: {
        action: 'SKYTAB_HOURS_CHANGED',
        entityType: 'location',
        entityId: location.id,
        changes: {
          locationGuid,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info({ locationId: location.id }, 'Location hours change recorded');
  }

  /**
   * Check for duplicate event (idempotency)
   */
  private async checkDuplicateEvent(eventId: string): Promise<boolean> {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: 'SKYTAB_WEBHOOK',
        entityId: eventId,
      },
    });

    return !!existing;
  }

  /**
   * Record webhook event for tracking
   */
  private async recordWebhookEvent(
    eventId: string,
    eventType: string,
    locationGuid: string,
    status: 'processed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'SKYTAB_WEBHOOK',
          entityType: 'webhook',
          entityId: eventId,
          changes: {
            eventType,
            locationGuid,
            status,
            errorMessage,
            processedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      logger.warn({ error, eventId }, 'Failed to record webhook event');
    }
  }

  /**
   * Map SkyTab ticket status to order status
   */
  private mapSkyTabStatusToOrderStatus(status: SkyTabTicketStatus): string {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
        return 'confirmed';
      case 'PREPARING':
        return 'preparing';
      case 'READY':
        return 'ready';
      case 'OUT_FOR_DELIVERY':
        return 'out-for-delivery';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}

// Export singleton instance
export const skyTabWebhookHandler = new SkyTabWebhookHandler();
