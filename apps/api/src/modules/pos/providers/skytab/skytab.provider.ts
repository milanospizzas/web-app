import type {
  POSProvider,
  POSMenuItem,
  POSModifier,
  POSOrder,
  POSOrderStatus,
} from '../../pos.interface';
import { skyTabClient, SkyTabApiError } from './skytab.client';
import { logger } from '../../../../shared/utils/logger';
import { prisma } from '../../../../shared/database/prisma';
import { config } from '../../../../config';
import type {
  SkyTabMenuResponse,
  SkyTabMenuUpdatesResponse,
  SkyTabMenuItem,
  SkyTabModifier,
  SkyTabCreateTicketRequest,
  SkyTabCreateTicketResponse,
  SkyTabTicketStatusResponse,
  SkyTabCancelTicketResponse,
  SkyTabStockStatusResponse,
  SkyTabUpdateStockResponse,
  SkyTabTicketStatus,
} from '@milanos/shared';

/**
 * SkyTab POS Provider
 * Implements POS provider interface for Shift4 SkyTab POS integration
 */
export class SkyTabProvider implements POSProvider {
  private locationGuid: string | null = null;

  constructor() {
    this.locationGuid = config.SKYTAB_LOCATION_ID || null;
  }

  /**
   * Set the location GUID for API calls
   */
  setLocationGuid(guid: string): void {
    this.locationGuid = guid;
  }

  /**
   * Get effective location GUID
   */
  private getLocationGuid(locationId?: string): string {
    const guid = locationId || this.locationGuid;
    if (!guid) {
      throw new Error('SkyTab location GUID not configured');
    }
    return guid;
  }

  /**
   * Authenticate with SkyTab API
   */
  async authenticate(): Promise<boolean> {
    try {
      const isConnected = await skyTabClient.testConnection();
      if (isConnected) {
        logger.info('SkyTab authentication successful');
      }
      return isConnected;
    } catch (error) {
      logger.error({ error }, 'SkyTab authentication failed');
      return false;
    }
  }

  /**
   * Sync full menu from SkyTab
   */
  async syncFullMenu(locationId: string): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }> {
    const locationGuid = this.getLocationGuid(locationId);

    try {
      logger.info({ locationGuid }, 'Starting full menu sync from SkyTab');

      const response = await skyTabClient.get<SkyTabMenuResponse>(
        `/api/rest/v1/pos/locations/${locationGuid}/menu`
      );

      const { menu } = response.result;

      // Map SkyTab items to our POSMenuItem format
      const items: POSMenuItem[] = menu.items.map((item) =>
        this.mapSkyTabItemToPOSMenuItem(item)
      );

      // Extract all modifiers from modifier groups
      const modifiers: POSModifier[] = menu.modifierGroups.flatMap((group) =>
        group.modifiers.map((mod) => this.mapSkyTabModifierToPOSModifier(mod))
      );

      // Store menu sync metadata
      await this.logMenuSync(locationGuid, 'full', items.length, modifiers.length);

      logger.info(
        { locationGuid, itemCount: items.length, modifierCount: modifiers.length },
        'Full menu sync completed'
      );

      return { items, modifiers };
    } catch (error) {
      logger.error({ error, locationGuid }, 'Full menu sync failed');
      throw this.handleApiError(error, 'MENU_SYNC_FAILED');
    }
  }

  /**
   * Sync menu updates since a specific date
   */
  async syncMenuUpdates(
    locationId: string,
    since: Date
  ): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }> {
    const locationGuid = this.getLocationGuid(locationId);

    try {
      const sinceIso = since.toISOString();
      logger.info({ locationGuid, since: sinceIso }, 'Starting incremental menu sync from SkyTab');

      const response = await skyTabClient.get<SkyTabMenuUpdatesResponse>(
        `/api/rest/v1/pos/locations/${locationGuid}/menu/updates?since=${encodeURIComponent(sinceIso)}`
      );

      const { updates } = response.result;

      // Map updated items
      const items: POSMenuItem[] = updates.items.map((item) =>
        this.mapSkyTabItemToPOSMenuItem(item)
      );

      // Map updated modifiers from groups
      const modifiers: POSModifier[] = updates.modifierGroups.flatMap((group) =>
        group.modifiers.map((mod) => this.mapSkyTabModifierToPOSModifier(mod))
      );

      // Handle deletions by marking items as unavailable
      if (updates.deletedItemGuids.length > 0) {
        logger.info(
          { deletedItems: updates.deletedItemGuids.length },
          'Marking deleted items as unavailable'
        );
        // These will be handled in the POS service by marking items with matching posItemId as unavailable
      }

      // Store menu sync metadata
      await this.logMenuSync(locationGuid, 'incremental', items.length, modifiers.length);

      logger.info(
        { locationGuid, itemCount: items.length, modifierCount: modifiers.length },
        'Incremental menu sync completed'
      );

      return { items, modifiers };
    } catch (error) {
      logger.error({ error, locationGuid }, 'Incremental menu sync failed');
      throw this.handleApiError(error, 'MENU_SYNC_FAILED');
    }
  }

  /**
   * Send order to SkyTab POS
   */
  async sendOrder(order: POSOrder): Promise<{ posOrderId: string; success: boolean }> {
    try {
      logger.info(
        { externalOrderId: order.externalOrderId, orderNumber: order.orderNumber },
        'Sending order to SkyTab POS'
      );

      const ticketRequest: SkyTabCreateTicketRequest = {
        ticket: {
          externalReference: order.externalOrderId,
          orderNumber: order.orderNumber,
          orderType: this.mapOrderTypeToSkyTab(order.orderType),
          customer: {
            name: order.customerName,
            phone: order.customerPhone,
          },
          items: order.items.map((item) => ({
            itemGuid: item.menuItemId,
            name: '', // Will be resolved by SkyTab
            quantity: item.quantity,
            unitPrice: 0, // Will be resolved by SkyTab
            totalPrice: 0, // Will be resolved by SkyTab
            specialInstructions: item.specialInstructions,
            modifiers: item.modifiers.map((mod) => ({
              modifierGuid: mod.modifierId,
              name: '', // Will be resolved by SkyTab
              quantity: mod.quantity,
              unitPrice: 0, // Will be resolved by SkyTab
              totalPrice: 0, // Will be resolved by SkyTab
            })),
          })),
          subtotal: order.total, // Total before tax
          tax: 0, // Tax calculated by POS
          total: order.total,
          scheduledFor: order.scheduledFor?.toISOString(),
          specialInstructions: order.specialInstructions,
        },
      };

      const response = await skyTabClient.post<SkyTabCreateTicketResponse>(
        `/api/rest/v1/pos/tickets`,
        ticketRequest
      );

      const { ticket } = response.result;

      logger.info(
        {
          externalOrderId: order.externalOrderId,
          posOrderId: ticket.guid,
          status: ticket.status,
        },
        'Order sent to SkyTab successfully'
      );

      return {
        posOrderId: ticket.guid,
        success: true,
      };
    } catch (error) {
      logger.error(
        { error, externalOrderId: order.externalOrderId },
        'Failed to send order to SkyTab'
      );
      throw this.handleApiError(error, 'ORDER_SUBMIT_FAILED');
    }
  }

  /**
   * Get order status from SkyTab
   */
  async getOrderStatus(posOrderId: string): Promise<POSOrderStatus> {
    try {
      logger.debug({ posOrderId }, 'Getting order status from SkyTab');

      const response = await skyTabClient.get<SkyTabTicketStatusResponse>(
        `/api/rest/v1/pos/tickets/${posOrderId}/status`
      );

      const { ticket } = response.result;

      return {
        orderId: ticket.guid,
        status: this.mapSkyTabStatusToLocal(ticket.status),
        estimatedReadyTime: ticket.estimatedReadyTime
          ? new Date(ticket.estimatedReadyTime)
          : undefined,
      };
    } catch (error) {
      logger.error({ error, posOrderId }, 'Failed to get order status from SkyTab');
      throw this.handleApiError(error, 'ORDER_STATUS_FAILED');
    }
  }

  /**
   * Cancel order in SkyTab POS
   */
  async cancelOrder(posOrderId: string): Promise<boolean> {
    try {
      logger.info({ posOrderId }, 'Cancelling order in SkyTab POS');

      const response = await skyTabClient.post<SkyTabCancelTicketResponse>(
        `/api/rest/v1/pos/tickets/${posOrderId}/cancel`,
        { reason: 'Customer requested cancellation' }
      );

      const success = response.result.success;

      if (success) {
        logger.info({ posOrderId }, 'Order cancelled in SkyTab successfully');
      }

      return success;
    } catch (error) {
      logger.error({ error, posOrderId }, 'Failed to cancel order in SkyTab');

      // If order not found or already cancelled, consider it a success
      if (error instanceof SkyTabApiError) {
        if (error.code === 'TICKET_NOT_FOUND' || error.code === 'INVALID_TICKET_STATUS') {
          logger.warn({ posOrderId }, 'Order not found or already cancelled in SkyTab');
          return true;
        }
      }

      throw this.handleApiError(error, 'ORDER_CANCEL_FAILED');
    }
  }

  /**
   * Update item availability in SkyTab (86 an item)
   */
  async updateItemAvailability(itemId: string, isAvailable: boolean): Promise<boolean> {
    const locationGuid = this.getLocationGuid();

    try {
      logger.info({ itemId, isAvailable, locationGuid }, 'Updating item availability in SkyTab');

      const response = await skyTabClient.put<SkyTabUpdateStockResponse>(
        `/api/rest/v1/pos/locations/${locationGuid}/stock`,
        {
          itemGuid: itemId,
          isAvailable,
        }
      );

      const success = response.result.success;

      if (success) {
        logger.info(
          { itemId, isAvailable },
          `Item ${isAvailable ? 'marked available' : '86\'d'} in SkyTab`
        );
      }

      return success;
    } catch (error) {
      logger.error({ error, itemId }, 'Failed to update item availability in SkyTab');
      throw this.handleApiError(error, 'STOCK_UPDATE_FAILED');
    }
  }

  /**
   * Get list of unavailable (86'd) items from SkyTab
   */
  async getUnavailableItems(locationId: string): Promise<string[]> {
    const locationGuid = this.getLocationGuid(locationId);

    try {
      logger.debug({ locationGuid }, 'Getting unavailable items from SkyTab');

      const response = await skyTabClient.get<SkyTabStockStatusResponse>(
        `/api/rest/v1/pos/locations/${locationGuid}/stock`
      );

      const unavailableItems = response.result.items
        .filter((item) => !item.isAvailable)
        .map((item) => item.itemGuid);

      logger.info(
        { locationGuid, count: unavailableItems.length },
        'Retrieved unavailable items from SkyTab'
      );

      return unavailableItems;
    } catch (error) {
      logger.error({ error, locationGuid }, 'Failed to get unavailable items from SkyTab');
      throw this.handleApiError(error, 'STOCK_STATUS_FAILED');
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Map SkyTab menu item to POSMenuItem format
   */
  private mapSkyTabItemToPOSMenuItem(item: SkyTabMenuItem): POSMenuItem {
    return {
      id: item.guid,
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryGuid,
      sku: item.sku,
      isAvailable: item.isActive && item.isAvailable,
    };
  }

  /**
   * Map SkyTab modifier to POSModifier format
   */
  private mapSkyTabModifierToPOSModifier(modifier: SkyTabModifier): POSModifier {
    return {
      id: modifier.guid,
      name: modifier.name,
      price: modifier.price,
      groupId: modifier.groupGuid,
      isAvailable: modifier.isAvailable,
    };
  }

  /**
   * Map local order type to SkyTab format
   */
  private mapOrderTypeToSkyTab(
    orderType: POSOrder['orderType']
  ): 'DELIVERY' | 'PICKUP' | 'DINE_IN' {
    switch (orderType) {
      case 'delivery':
        return 'DELIVERY';
      case 'pickup':
        return 'PICKUP';
      case 'dine-in':
        return 'DINE_IN';
      default:
        return 'PICKUP';
    }
  }

  /**
   * Map SkyTab ticket status to local status format
   */
  private mapSkyTabStatusToLocal(
    status: SkyTabTicketStatus
  ): POSOrderStatus['status'] {
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
        return 'ready'; // Map to ready since we don't have out-for-delivery in interface
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: unknown, defaultCode: string): Error {
    if (error instanceof SkyTabApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new SkyTabApiError(error.message, defaultCode, 500);
    }

    return new SkyTabApiError('An unexpected error occurred', defaultCode, 500);
  }

  /**
   * Log menu sync for tracking
   */
  private async logMenuSync(
    locationGuid: string,
    syncType: 'full' | 'incremental',
    itemCount: number,
    modifierCount: number
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'SKYTAB_MENU_SYNC',
          entityType: 'menu',
          entityId: locationGuid,
          changes: {
            syncType,
            itemCount,
            modifierCount,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      // Don't fail the sync if logging fails
      logger.warn({ error }, 'Failed to log menu sync');
    }
  }
}

// Export singleton instance
export const skyTabProvider = new SkyTabProvider();
