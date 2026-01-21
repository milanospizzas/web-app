import type {
  POSProvider,
  POSMenuItem,
  POSModifier,
  POSOrder,
  POSOrderStatus,
} from '../pos.interface';
import { logger } from '../../../shared/utils/logger';

/**
 * Mock POS Provider for development and testing
 * Simulates a real POS system without external dependencies
 */
export class MockPOSProvider implements POSProvider {
  private unavailableItems: Set<string> = new Set();
  private orders: Map<string, POSOrderStatus> = new Map();

  async authenticate(): Promise<boolean> {
    logger.info('Mock POS: Authentication successful');
    return true;
  }

  async syncFullMenu(locationId: string): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }> {
    logger.info({ locationId }, 'Mock POS: Full menu sync requested');

    // Return mock menu data
    const items: POSMenuItem[] = [
      {
        id: 'pos-item-1',
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, basil, and tomato sauce',
        price: 12.99,
        categoryId: 'pizzas',
        sku: 'PIZZA-MARG',
        isAvailable: true,
      },
      {
        id: 'pos-item-2',
        name: 'Pepperoni Pizza',
        description: 'Classic pepperoni with mozzarella',
        price: 14.99,
        categoryId: 'pizzas',
        sku: 'PIZZA-PEP',
        isAvailable: true,
      },
    ];

    const modifiers: POSModifier[] = [
      {
        id: 'pos-mod-1',
        name: 'Extra Cheese',
        price: 2.0,
        groupId: 'toppings',
        isAvailable: true,
      },
      {
        id: 'pos-mod-2',
        name: 'Mushrooms',
        price: 1.5,
        groupId: 'toppings',
        isAvailable: true,
      },
    ];

    return { items, modifiers };
  }

  async syncMenuUpdates(locationId: string, since: Date): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }> {
    logger.info({ locationId, since }, 'Mock POS: Incremental menu sync requested');

    // Return empty arrays (no updates)
    return { items: [], modifiers: [] };
  }

  async sendOrder(order: POSOrder): Promise<{ posOrderId: string; success: boolean }> {
    const posOrderId = `POS-${Date.now()}`;

    logger.info(
      {
        externalOrderId: order.externalOrderId,
        posOrderId,
        orderNumber: order.orderNumber,
      },
      'Mock POS: Order sent'
    );

    // Store order status
    this.orders.set(posOrderId, {
      orderId: posOrderId,
      status: 'confirmed',
      estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
    });

    // Simulate async status updates
    setTimeout(() => {
      this.orders.set(posOrderId, {
        orderId: posOrderId,
        status: 'preparing',
      });
    }, 2000);

    setTimeout(() => {
      this.orders.set(posOrderId, {
        orderId: posOrderId,
        status: 'ready',
      });
    }, 10000);

    return { posOrderId, success: true };
  }

  async getOrderStatus(posOrderId: string): Promise<POSOrderStatus> {
    logger.info({ posOrderId }, 'Mock POS: Order status requested');

    const status = this.orders.get(posOrderId);

    if (!status) {
      return {
        orderId: posOrderId,
        status: 'pending',
      };
    }

    return status;
  }

  async cancelOrder(posOrderId: string): Promise<boolean> {
    logger.info({ posOrderId }, 'Mock POS: Order cancelled');

    this.orders.set(posOrderId, {
      orderId: posOrderId,
      status: 'cancelled',
    });

    return true;
  }

  async updateItemAvailability(itemId: string, isAvailable: boolean): Promise<boolean> {
    logger.info({ itemId, isAvailable }, 'Mock POS: Item availability updated');

    if (isAvailable) {
      this.unavailableItems.delete(itemId);
    } else {
      this.unavailableItems.add(itemId);
    }

    return true;
  }

  async getUnavailableItems(locationId: string): Promise<string[]> {
    logger.info({ locationId }, 'Mock POS: Unavailable items requested');
    return Array.from(this.unavailableItems);
  }
}

export const mockPOSProvider = new MockPOSProvider();
