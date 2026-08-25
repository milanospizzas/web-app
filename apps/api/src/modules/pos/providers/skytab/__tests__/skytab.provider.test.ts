import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkyTabProvider } from '../skytab.provider';
import { SkyTabApiError } from '../skytab.client';
import type {
  SkyTabMenuResponse,
  SkyTabCreateTicketResponse,
  SkyTabTicketStatusResponse,
  SkyTabCancelTicketResponse,
  SkyTabStockStatusResponse,
} from '@milanos/shared';

const { mockGet, mockPost, mockPut, mockTestConnection } = vi.hoisted(() => ({
  mockGet: vi.fn<[endpoint: string], Promise<unknown>>(),
  mockPost: vi.fn<[endpoint: string, body?: unknown], Promise<unknown>>(),
  mockPut: vi.fn<[endpoint: string, body?: unknown], Promise<unknown>>(),
  mockTestConnection: vi.fn<[], Promise<boolean>>(),
}));

// Mock the client
vi.mock('../skytab.client', () => ({
  skyTabClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    testConnection: mockTestConnection,
  },
  SkyTabApiError: class extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode: number) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

// Mock prisma
vi.mock('../../../../../shared/database/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../../../../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SkyTabProvider', () => {
  let provider: SkyTabProvider;
  const mockLocationGuid = 'test-location-123';

  beforeEach(() => {
    provider = new SkyTabProvider();
    provider.setLocationGuid(mockLocationGuid);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('authenticate', () => {
    it('should return true when connection is successful', async () => {
      mockTestConnection.mockResolvedValue(true);

      const result = await provider.authenticate();

      expect(result).toBe(true);
      expect(mockTestConnection).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockTestConnection.mockResolvedValue(false);

      const result = await provider.authenticate();

      expect(result).toBe(false);
    });

    it('should return false and log error when exception occurs', async () => {
      mockTestConnection.mockRejectedValue(new Error('Network error'));

      const result = await provider.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('syncFullMenu', () => {
    const mockMenuResponse: SkyTabMenuResponse = {
      result: {
        menu: {
          guid: 'menu-123',
          name: 'Main Menu',
          locationGuid: mockLocationGuid,
          categories: [
            {
              guid: 'cat-1',
              name: 'Pizzas',
              sortOrder: 1,
              isActive: true,
            },
          ],
          items: [
            {
              guid: 'item-1',
              name: 'Margherita Pizza',
              description: 'Classic pizza',
              price: 12.99,
              categoryGuid: 'cat-1',
              isActive: true,
              isAvailable: true,
              sortOrder: 1,
              sku: 'PIZZA-MARG',
            },
            {
              guid: 'item-2',
              name: 'Pepperoni Pizza',
              price: 14.99,
              categoryGuid: 'cat-1',
              isActive: true,
              isAvailable: true,
              sortOrder: 2,
            },
          ],
          modifierGroups: [
            {
              guid: 'mod-group-1',
              name: 'Toppings',
              minSelection: 0,
              maxSelection: 5,
              isRequired: false,
              sortOrder: 1,
              modifiers: [
                {
                  guid: 'mod-1',
                  name: 'Extra Cheese',
                  price: 2.0,
                  isAvailable: true,
                  sortOrder: 1,
                  groupGuid: 'mod-group-1',
                },
              ],
            },
          ],
          lastModified: '2024-01-15T10:00:00Z',
        },
      },
    };

    it('should sync full menu successfully', async () => {
      mockGet.mockResolvedValue(mockMenuResponse);

      const result = await provider.syncFullMenu(mockLocationGuid);

      expect(result.items).toHaveLength(2);
      expect(result.modifiers).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'item-1',
        name: 'Margherita Pizza',
        description: 'Classic pizza',
        price: 12.99,
        categoryId: 'cat-1',
        sku: 'PIZZA-MARG',
        isAvailable: true,
      });
      expect(result.modifiers[0]).toEqual({
        id: 'mod-1',
        name: 'Extra Cheese',
        price: 2.0,
        groupId: 'mod-group-1',
        isAvailable: true,
      });
    });

    it('should throw error when menu sync fails', async () => {
      mockGet.mockRejectedValue(
        new SkyTabApiError('Menu sync failed', 'MENU_SYNC_FAILED', 500)
      );

      await expect(provider.syncFullMenu(mockLocationGuid)).rejects.toThrow();
    });
  });

  describe('sendOrder', () => {
    const mockOrder = {
      externalOrderId: 'order-123',
      orderNumber: 'ORD-001',
      orderType: 'delivery' as const,
      customerName: 'John Doe',
      customerPhone: '555-1234',
      items: [
        {
          menuItemId: 'item-1',
          quantity: 2,
          specialInstructions: 'Extra crispy',
          modifiers: [
            {
              modifierId: 'mod-1',
              quantity: 1,
            },
          ],
        },
      ],
      total: 29.98,
      scheduledFor: new Date('2024-01-15T18:00:00Z'),
      specialInstructions: 'Ring doorbell',
    };

    const mockTicketResponse: SkyTabCreateTicketResponse = {
      result: {
        ticket: {
          guid: 'ticket-123',
          externalReference: 'order-123',
          orderNumber: 'ORD-001',
          status: 'CONFIRMED',
          estimatedReadyTime: '2024-01-15T17:30:00Z',
          createdAt: '2024-01-15T17:00:00Z',
        },
      },
    };

    it('should send order successfully', async () => {
      mockPost.mockResolvedValue(mockTicketResponse);

      const result = await provider.sendOrder(mockOrder);
      const request: unknown = mockPost.mock.calls[0]?.[1];

      expect(result.success).toBe(true);
      expect(result.posOrderId).toBe('ticket-123');
      expect(mockPost.mock.calls[0]?.[0]).toBe('/api/rest/v1/pos/tickets');
      expect(request).toMatchObject({
        ticket: {
          externalReference: 'order-123',
          orderType: 'DELIVERY',
        },
      });
    });

    it('should map order type correctly', async () => {
      mockPost.mockResolvedValue(mockTicketResponse);

      // Test pickup
      await provider.sendOrder({ ...mockOrder, orderType: 'pickup' });
      expect(mockPost.mock.calls[0]?.[1]).toMatchObject({
        ticket: { orderType: 'PICKUP' },
      });

      // Test dine-in
      vi.clearAllMocks();
      await provider.sendOrder({ ...mockOrder, orderType: 'dine-in' });
      expect(mockPost.mock.calls[0]?.[1]).toMatchObject({
        ticket: { orderType: 'DINE_IN' },
      });
    });

    it('should throw error when order submission fails', async () => {
      mockPost.mockRejectedValue(
        new SkyTabApiError('Order failed', 'ORDER_SUBMIT_FAILED', 500)
      );

      await expect(provider.sendOrder(mockOrder)).rejects.toThrow();
    });
  });

  describe('getOrderStatus', () => {
    const mockStatusResponse: SkyTabTicketStatusResponse = {
      result: {
        ticket: {
          guid: 'ticket-123',
          externalReference: 'order-123',
          status: 'PREPARING',
          estimatedReadyTime: '2024-01-15T17:45:00Z',
          updatedAt: '2024-01-15T17:20:00Z',
        },
      },
    };

    it('should get order status successfully', async () => {
      mockGet.mockResolvedValue(mockStatusResponse);

      const result = await provider.getOrderStatus('ticket-123');

      expect(result.orderId).toBe('ticket-123');
      expect(result.status).toBe('preparing');
      expect(result.estimatedReadyTime).toEqual(new Date('2024-01-15T17:45:00Z'));
    });

    it('should map all status types correctly', async () => {
      const statusMap: Array<[string, string]> = [
        ['PENDING', 'pending'],
        ['CONFIRMED', 'confirmed'],
        ['PREPARING', 'preparing'],
        ['READY', 'ready'],
        ['OUT_FOR_DELIVERY', 'ready'],
        ['COMPLETED', 'completed'],
        ['CANCELLED', 'cancelled'],
      ];

      for (const [skyTabStatus, expectedStatus] of statusMap) {
        mockGet.mockResolvedValue({
          result: {
            ticket: {
              guid: 'ticket-123',
              externalReference: 'order-123',
              status: skyTabStatus,
              updatedAt: '2024-01-15T17:20:00Z',
            },
          },
        });

        const result = await provider.getOrderStatus('ticket-123');
        expect(result.status).toBe(expectedStatus);
      }
    });
  });

  describe('cancelOrder', () => {
    const mockCancelResponse: SkyTabCancelTicketResponse = {
      result: {
        success: true,
        ticket: {
          guid: 'ticket-123',
          status: 'CANCELLED',
        },
      },
    };

    it('should cancel order successfully', async () => {
      mockPost.mockResolvedValue(mockCancelResponse);

      const result = await provider.cancelOrder('ticket-123');

      expect(result).toBe(true);
    });

    it('should return true for already cancelled orders', async () => {
      mockPost.mockRejectedValue(
        new SkyTabApiError('Invalid status', 'INVALID_TICKET_STATUS', 400)
      );

      const result = await provider.cancelOrder('ticket-123');

      expect(result).toBe(true);
    });

    it('should return true for not found orders', async () => {
      mockPost.mockRejectedValue(
        new SkyTabApiError('Not found', 'TICKET_NOT_FOUND', 404)
      );

      const result = await provider.cancelOrder('ticket-123');

      expect(result).toBe(true);
    });
  });

  describe('updateItemAvailability', () => {
    it('should update item availability successfully', async () => {
      mockPut.mockResolvedValue({
        result: {
          success: true,
          item: {
            itemGuid: 'item-1',
            isAvailable: false,
            lastUpdated: '2024-01-15T17:00:00Z',
          },
        },
      });

      const result = await provider.updateItemAvailability('item-1', false);

      expect(result).toBe(true);
      expect(mockPut).toHaveBeenCalledWith(
        `/api/rest/v1/pos/locations/${mockLocationGuid}/stock`,
        {
          itemGuid: 'item-1',
          isAvailable: false,
        }
      );
    });
  });

  describe('getUnavailableItems', () => {
    const mockStockResponse: SkyTabStockStatusResponse = {
      result: {
        items: [
          { itemGuid: 'item-1', isAvailable: false, lastUpdated: '2024-01-15T17:00:00Z' },
          { itemGuid: 'item-2', isAvailable: true, lastUpdated: '2024-01-15T17:00:00Z' },
          { itemGuid: 'item-3', isAvailable: false, lastUpdated: '2024-01-15T17:00:00Z' },
        ],
        lastUpdated: '2024-01-15T17:00:00Z',
      },
    };

    it('should get unavailable items successfully', async () => {
      mockGet.mockResolvedValue(mockStockResponse);

      const result = await provider.getUnavailableItems(mockLocationGuid);

      expect(result).toEqual(['item-1', 'item-3']);
      expect(result).not.toContain('item-2');
    });
  });
});
