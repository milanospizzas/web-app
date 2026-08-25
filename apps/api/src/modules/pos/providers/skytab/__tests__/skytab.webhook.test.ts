import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { SkyTabWebhookHandler } from '../skytab.webhook';
import type {
  SkyTabWebhookPayload,
  SkyTabWebhookEventType,
  SkyTabTicketWebhookData,
  SkyTabMenuWebhookData,
  SkyTabStockWebhookData,
  SkyTabLocationWebhookData,
} from '@milanos/shared';

// Mock config
vi.mock('../../../../../config', () => ({
  config: {
    SKYTAB_WEBHOOK_SECRET: 'test-webhook-secret',
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

// Mock prisma
const mockPrisma = vi.hoisted(() => ({
  order: {
    findFirst: vi.fn<[], Promise<unknown>>(),
    update: vi.fn<[args: unknown], Promise<unknown>>(),
  },
  orderStatusHistory: {
    create: vi.fn<[], Promise<unknown>>(),
  },
  location: {
    findFirst: vi.fn<[], Promise<unknown>>(),
  },
  menu: {
    updateMany: vi.fn<[], Promise<unknown>>(),
  },
  menuItem: {
    findFirst: vi.fn<[], Promise<unknown>>(),
    update: vi.fn<[], Promise<unknown>>(),
    updateMany: vi.fn<[], Promise<unknown>>(),
  },
  auditLog: {
    findFirst: vi.fn<[], Promise<unknown>>(),
    create: vi.fn<[], Promise<unknown>>(),
  },
}));

vi.mock('../../../../../shared/database/prisma', () => ({
  prisma: mockPrisma,
}));

describe('SkyTabWebhookHandler', () => {
  let handler: SkyTabWebhookHandler;

  beforeEach(() => {
    handler = new SkyTabWebhookHandler();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-webhook-secret';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = handler.verifySignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid-signature-that-is-long-enough-to-be-hex';

      const result = handler.verifySignature(payload, invalidSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong length', () => {
      const payload = JSON.stringify({ test: 'data' });
      const shortSignature = 'abc123';

      const result = handler.verifySignature(payload, shortSignature);

      expect(result).toBe(false);
    });
  });

  describe('processWebhook', () => {
    describe('ticket events', () => {
      const createTicketPayload = (
        eventType: SkyTabWebhookEventType,
        data: Partial<SkyTabTicketWebhookData>
      ): SkyTabWebhookPayload => ({
        eventType,
        eventId: 'event-123',
        timestamp: '2024-01-15T17:00:00Z',
        locationGuid: 'location-123',
        data: {
          ticketGuid: 'ticket-123',
          externalReference: 'order-123',
          status: 'CONFIRMED',
          ...data,
        } as SkyTabTicketWebhookData,
        signature: '',
      });

      it('should process ticket.status_changed event', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null); // No duplicate
        mockPrisma.order.findFirst.mockResolvedValue({
          id: 'order-123',
          status: 'pending',
        });
        mockPrisma.order.update.mockResolvedValue({});
        mockPrisma.orderStatusHistory.create.mockResolvedValue({});
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload = createTicketPayload('ticket.status_changed', {
          status: 'PREPARING',
          previousStatus: 'CONFIRMED',
        });

        const result = await handler.processWebhook(payload);
        const update: unknown = mockPrisma.order.update.mock.calls[0]?.[0];

        expect(result.success).toBe(true);
        expect(update).toMatchObject({
          where: { id: 'order-123' },
          data: { status: 'preparing' },
        });
      });

      it('should process ticket.cancelled event', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.order.findFirst.mockResolvedValue({
          id: 'order-123',
          status: 'confirmed',
        });
        mockPrisma.order.update.mockResolvedValue({});
        mockPrisma.orderStatusHistory.create.mockResolvedValue({});
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload = createTicketPayload('ticket.cancelled', {
          status: 'CANCELLED',
          cancellationReason: 'Customer request',
        });

        const result = await handler.processWebhook(payload);
        const update: unknown = mockPrisma.order.update.mock.calls[0]?.[0];

        expect(result.success).toBe(true);
        expect(update).toMatchObject({
          data: { status: 'cancelled' },
        });
      });

      it('should skip duplicate events', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue({ id: 'existing-log' });

        const payload = createTicketPayload('ticket.status_changed', {});

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Event already processed');
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('should handle order not found gracefully', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.order.findFirst.mockResolvedValue(null);
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload = createTicketPayload('ticket.status_changed', {});

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });
    });

    describe('menu events', () => {
      it('should process menu.updated event', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.location.findFirst.mockResolvedValue({
          id: 'location-id-123',
        });
        mockPrisma.menu.updateMany.mockResolvedValue({});
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload: SkyTabWebhookPayload = {
          eventType: 'menu.updated',
          eventId: 'event-456',
          timestamp: '2024-01-15T17:00:00Z',
          locationGuid: 'location-123',
          data: {
            menuGuid: 'menu-123',
            changedItems: ['item-1', 'item-2'],
          } satisfies SkyTabMenuWebhookData,
          signature: '',
        };

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(mockPrisma.menu.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { locationId: 'location-id-123' },
          })
        );
      });
    });

    describe('stock events', () => {
      it('should process stock.updated event', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.menuItem.findFirst.mockResolvedValue({
          id: 'menu-item-id-1',
        });
        mockPrisma.menuItem.update.mockResolvedValue({});
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload: SkyTabWebhookPayload = {
          eventType: 'stock.updated',
          eventId: 'event-789',
          timestamp: '2024-01-15T17:00:00Z',
          locationGuid: 'location-123',
          data: {
            items: [
              { itemGuid: 'item-1', isAvailable: false },
              { itemGuid: 'item-2', isAvailable: true },
            ],
          } satisfies SkyTabStockWebhookData,
          signature: '',
        };

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(mockPrisma.menuItem.update).toHaveBeenCalled();
      });

      it('should handle item not found for stock update', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.menuItem.findFirst.mockResolvedValue(null);
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload: SkyTabWebhookPayload = {
          eventType: 'stock.updated',
          eventId: 'event-789',
          timestamp: '2024-01-15T17:00:00Z',
          locationGuid: 'location-123',
          data: {
            items: [{ itemGuid: 'unknown-item', isAvailable: false }],
          } satisfies SkyTabStockWebhookData,
          signature: '',
        };

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(mockPrisma.menuItem.update).not.toHaveBeenCalled();
      });
    });

    describe('location events', () => {
      it('should process location.hours_changed event', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.location.findFirst.mockResolvedValue({
          id: 'location-id-123',
        });
        mockPrisma.auditLog.create.mockResolvedValue({});

        const payload: SkyTabWebhookPayload = {
          eventType: 'location.hours_changed',
          eventId: 'event-abc',
          timestamp: '2024-01-15T17:00:00Z',
          locationGuid: 'location-123',
          data: {
            locationGuid: 'location-123',
            isOpen: true,
          } satisfies SkyTabLocationWebhookData,
          signature: '',
        };

        const result = await handler.processWebhook(payload);

        expect(result.success).toBe(true);
        expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2); // One for event, one for location hours
      });
    });

    describe('error handling', () => {
      it('should record failed webhook processing', async () => {
        mockPrisma.auditLog.findFirst.mockResolvedValue(null);
        mockPrisma.order.findFirst.mockRejectedValue(new Error('Database error'));

        const payload: SkyTabWebhookPayload = {
          eventType: 'ticket.status_changed',
          eventId: 'event-error',
          timestamp: '2024-01-15T17:00:00Z',
          locationGuid: 'location-123',
          data: {
            ticketGuid: 'ticket-123',
            externalReference: 'order-123',
            status: 'CONFIRMED',
          } as SkyTabTicketWebhookData,
          signature: '',
        };

        await expect(handler.processWebhook(payload)).rejects.toThrow('Database error');
      });
    });
  });
});
