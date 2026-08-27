import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { CreateOrderInput } from '@milanos/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  locationFindUnique: vi.fn(),
  menuItemFindUnique: vi.fn(),
  modifierFindUnique: vi.fn(),
  orderCreate: vi.fn<[Prisma.OrderCreateArgs], Promise<unknown>>(),
  orderFindFirst: vi.fn(),
  orderFindMany: vi.fn(),
  orderCount: vi.fn(),
  orderUpdate: vi.fn<[Prisma.OrderUpdateArgs], Promise<unknown>>(),
  sendOrderConfirmation: vi.fn(),
  sendOrderStatusUpdate: vi.fn(),
  awardPointsForOrder: vi.fn(),
}));

vi.mock('../../../shared/database/prisma', () => ({
  prisma: {
    location: { findUnique: mocks.locationFindUnique },
    menuItem: { findUnique: mocks.menuItemFindUnique },
    modifier: { findUnique: mocks.modifierFindUnique },
    order: {
      create: mocks.orderCreate,
      findFirst: mocks.orderFindFirst,
      findMany: mocks.orderFindMany,
      count: mocks.orderCount,
      update: mocks.orderUpdate,
    },
  },
}));

vi.mock('../../email/email.service', () => ({
  emailService: {
    sendOrderConfirmation: mocks.sendOrderConfirmation,
    sendOrderStatusUpdate: mocks.sendOrderStatusUpdate,
  },
}));

vi.mock('../../loyalty/loyalty.service', () => ({
  loyaltyService: { awardPointsForOrder: mocks.awardPointsForOrder },
}));

import {
  customerOrderMutationSelect,
  customerOrderSelect,
  customerOrderSummarySelect,
  OrderCancellationStateError,
  OrdersService,
} from '../orders.service';

const userId = 'synthetic-owner-id';
const orderId = 'synthetic-order-id';

const orderData: CreateOrderInput = {
  locationId: 'synthetic-location-id',
  orderType: 'pickup',
  items: [
    {
      menuItemId: 'synthetic-menu-item-id',
      quantity: 2,
      modifiers: [],
    },
  ],
  customerName: 'Synthetic Customer',
  customerEmail: 'customer@example.test',
  customerPhone: '15555550100',
};

const customerOrderResult = {
  id: orderId,
  orderNumber: '202608260001',
  orderType: 'pickup',
  status: 'cancelled',
  total: new Decimal(25),
  customerEmail: orderData.customerEmail,
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
  mocks.locationFindUnique.mockResolvedValue({ acceptsOrders: true });
  mocks.menuItemFindUnique.mockResolvedValue({
    id: 'synthetic-menu-item-id',
    isAvailable: true,
    is86ed: false,
    price: new Decimal(10),
  });
  mocks.orderCreate.mockResolvedValue({
    ...customerOrderResult,
    status: 'pending',
  });
  mocks.sendOrderConfirmation.mockResolvedValue(undefined);
  mocks.sendOrderStatusUpdate.mockResolvedValue(undefined);
});

describe('OrdersService authenticated ownership', () => {
  it('persists the required authenticated user ID when creating an order', async () => {
    const service = new OrdersService();

    const result = await service.createOrder(userId, orderData);
    const createArgs = mocks.orderCreate.mock.calls[0]?.[0];

    expect(result).toEqual({ ...customerOrderResult, status: 'pending' });
    expect(createArgs?.data).toHaveProperty('userId', userId);
    expect(createArgs?.select).toEqual(customerOrderMutationSelect);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledOnce();
  });

  it('queries customer order detail by exact order ID and user ID', async () => {
    mocks.orderFindFirst.mockResolvedValue(null);
    const service = new OrdersService();

    const result = await service.getOrderForUser(orderId, userId);

    expect(result).toBeNull();
    expect(mocks.orderFindFirst).toHaveBeenCalledWith({
      where: { id: orderId, userId },
      select: customerOrderSelect,
    });
  });

  it('queries the customer order list only by the authenticated user ID', async () => {
    mocks.orderFindMany.mockResolvedValue([]);
    mocks.orderCount.mockResolvedValue(0);
    const service = new OrdersService();

    const result = await service.getUserOrders(userId, 2, 5);

    expect(result).toEqual({ orders: [], total: 0, page: 2, limit: 5 });
    expect(mocks.orderFindMany).toHaveBeenCalledWith({
      where: { userId },
      select: customerOrderSummarySelect,
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(mocks.orderCount).toHaveBeenCalledWith({ where: { userId } });
  });
});

describe('OrdersService owner-scoped cancellation', () => {
  it('returns null without updating when the exact owner-scoped order is missing', async () => {
    mocks.orderFindFirst.mockResolvedValue(null);
    const service = new OrdersService();

    const result = await service.cancelOrderForUser(orderId, userId, 'Synthetic reason');

    expect(result).toBeNull();
    expect(mocks.orderFindFirst).toHaveBeenCalledWith({
      where: { id: orderId, userId },
      select: { status: true },
    });
    expect(mocks.orderUpdate).not.toHaveBeenCalled();
    expect(mocks.sendOrderStatusUpdate).not.toHaveBeenCalled();
  });

  it.each(['pending', 'confirmed'])(
    'cancels an owned %s order with an owner-scoped update',
    async (status) => {
      mocks.orderFindFirst.mockResolvedValue({ status });
      mocks.orderUpdate.mockResolvedValue(customerOrderResult);
      const service = new OrdersService();

      const result = await service.cancelOrderForUser(orderId, userId, 'Synthetic reason');
      const updateArgs = mocks.orderUpdate.mock.calls[0]?.[0];

      expect(result).toEqual(customerOrderResult);
      expect(updateArgs?.where).toEqual({ id: orderId, userId });
      expect(updateArgs?.data).toMatchObject({
        status: 'cancelled',
        statusHistory: {
          create: {
            status: 'cancelled',
            note: 'Synthetic reason',
            changedBy: userId,
          },
        },
      });
      expect(updateArgs?.data).toHaveProperty('cancelledAt');
      expect(updateArgs?.select).toEqual(customerOrderMutationSelect);
      expect(mocks.sendOrderStatusUpdate).toHaveBeenCalledWith(customerOrderResult, 'cancelled');
    }
  );

  it('rejects an ineligible owned order without updating it', async () => {
    mocks.orderFindFirst.mockResolvedValue({ status: 'completed' });
    const service = new OrdersService();

    await expect(service.cancelOrderForUser(orderId, userId)).rejects.toBeInstanceOf(
      OrderCancellationStateError
    );
    expect(mocks.orderUpdate).not.toHaveBeenCalled();
  });
});

describe('customer order Prisma projections', () => {
  it('excludes provider, network, POS, and audit fields while retaining safe payment summaries', () => {
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

    expect(findForbiddenKey(customerOrderSelect, forbiddenKeys)).toBeNull();
    expect(findForbiddenKey(customerOrderMutationSelect, forbiddenKeys)).toBeNull();
    expect(findForbiddenKey(customerOrderSummarySelect, forbiddenKeys)).toBeNull();
    expect(customerOrderSelect.payments.select).toEqual({
      id: true,
      transactionType: true,
      status: true,
      amount: true,
      currency: true,
      cardLast4: true,
      cardBrand: true,
      createdAt: true,
      updatedAt: true,
    });
    expect(customerOrderSelect.statusHistory.select).not.toHaveProperty('changedBy');
  });
});
