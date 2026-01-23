import { prisma } from '../../shared/database/prisma';
import { logger } from '../../shared/utils/logger';
import type { POSProvider, POSOrder } from './pos.interface';
import { mockPOSProvider } from './providers/mock-pos.provider';
import { skyTabProvider } from './providers/skytab';

export class POSService {
  private providers: Map<string, POSProvider> = new Map();

  constructor() {
    // Register providers
    this.providers.set('mock', mockPOSProvider);
    this.providers.set('skytab', skyTabProvider);
    // Add other providers here (Toast, Square, etc.)
  }

  getProvider(systemType: string): POSProvider {
    const provider = this.providers.get(systemType);
    if (!provider) {
      throw new Error(`POS provider not found: ${systemType}`);
    }
    return provider;
  }

  async syncMenu(locationId: string) {
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || !location.posSystemType) {
      throw new Error('Location or POS system not configured');
    }

    const provider = this.getProvider(location.posSystemType);

    try {
      const { items, modifiers } = await provider.syncFullMenu(locationId);

      logger.info(
        { locationId, itemCount: items.length, modifierCount: modifiers.length },
        'Menu sync completed'
      );

      // Update local database with synced data
      // (Implementation would map POS data to our schema)

      await prisma.menu.updateMany({
        where: { locationId },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, itemCount: items.length, modifierCount: modifiers.length };
    } catch (error) {
      logger.error({ error, locationId }, 'Menu sync failed');
      throw error;
    }
  }

  async sendOrderToPOS(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        location: true,
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
      },
    });

    if (!order || !order.location.posSystemType) {
      throw new Error('Order or POS system not found');
    }

    const provider = this.getProvider(order.location.posSystemType);

    const posOrder: POSOrder = {
      externalOrderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType as any,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items.map((item) => ({
        menuItemId: item.menuItem.posItemId || item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || undefined,
        modifiers: item.modifiers.map((mod) => ({
          modifierId: mod.modifier.posModifierId || mod.modifierId,
          quantity: mod.quantity,
        })),
      })),
      total: order.total.toNumber(),
      scheduledFor: order.scheduledFor || undefined,
      specialInstructions: order.specialInstructions || undefined,
    };

    try {
      const result = await provider.sendOrder(posOrder);

      // Update order with POS reference
      await prisma.order.update({
        where: { id: orderId },
        data: {
          posOrderId: result.posOrderId,
          posSyncStatus: result.success ? 'synced' : 'failed',
          posSyncedAt: new Date(),
        },
      });

      logger.info({ orderId, posOrderId: result.posOrderId }, 'Order sent to POS');

      return result;
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to send order to POS');

      await prisma.order.update({
        where: { id: orderId },
        data: {
          posSyncStatus: 'failed',
          posErrorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async updateItemAvailability(itemId: string, isAvailable: boolean) {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    if (!item || !item.category.menu.location.posSystemType) {
      throw new Error('Item or POS system not found');
    }

    const provider = this.getProvider(item.category.menu.location.posSystemType);

    try {
      await provider.updateItemAvailability(item.posItemId || itemId, isAvailable);

      // Update local database
      await prisma.menuItem.update({
        where: { id: itemId },
        data: { is86ed: !isAvailable },
      });

      logger.info({ itemId, isAvailable }, 'Item availability updated in POS');

      return { success: true };
    } catch (error) {
      logger.error({ error, itemId }, 'Failed to update item availability in POS');
      throw error;
    }
  }
}

export const posService = new POSService();
