import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../shared/database/prisma';
import { config } from '../../config';
import { emailService } from '../email/email.service';
import { loyaltyService } from '../loyalty/loyalty.service';
import { calculateTax, calculateOrderTotal } from '@milanos/shared';
import type { CreateOrderInput, OrderStatus } from '@milanos/shared';

const customerMenuItemSelect = Prisma.validator<Prisma.MenuItemSelect>()({
  id: true,
  name: true,
  description: true,
  price: true,
  calories: true,
  imageUrl: true,
  tags: true,
  allergens: true,
});

const customerModifierSelect = Prisma.validator<Prisma.ModifierSelect>()({
  id: true,
  name: true,
  price: true,
  calories: true,
});

const customerOrderItemSelect = Prisma.validator<Prisma.OrderItemSelect>()({
  id: true,
  orderId: true,
  menuItemId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  specialInstructions: true,
  createdAt: true,
  menuItem: { select: customerMenuItemSelect },
  modifiers: {
    select: {
      id: true,
      orderItemId: true,
      modifierId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      createdAt: true,
      modifier: { select: customerModifierSelect },
    },
  },
});

const customerLocationSelect = Prisma.validator<Prisma.LocationSelect>()({
  id: true,
  name: true,
  slug: true,
  address1: true,
  address2: true,
  city: true,
  state: true,
  zipCode: true,
  phone: true,
  email: true,
  timezone: true,
  latitude: true,
  longitude: true,
});

const customerOrderScalarSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  locationId: true,
  addressId: true,
  orderType: true,
  status: true,
  subtotal: true,
  tax: true,
  deliveryFee: true,
  tip: true,
  discount: true,
  loyaltyDiscount: true,
  total: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  deliveryAddress1: true,
  deliveryAddress2: true,
  deliveryCity: true,
  deliveryState: true,
  deliveryZipCode: true,
  deliveryNotes: true,
  scheduledFor: true,
  estimatedReadyAt: true,
  estimatedDeliveryAt: true,
  preparedAt: true,
  completedAt: true,
  cancelledAt: true,
  specialInstructions: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const customerOrderSelect = Prisma.validator<Prisma.OrderSelect>()({
  ...customerOrderScalarSelect,
  items: { select: customerOrderItemSelect },
  payments: {
    select: {
      id: true,
      transactionType: true,
      status: true,
      amount: true,
      currency: true,
      cardLast4: true,
      cardBrand: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  statusHistory: {
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
});

export const customerOrderMutationSelect = Prisma.validator<Prisma.OrderSelect>()({
  ...customerOrderScalarSelect,
  items: { select: customerOrderItemSelect },
});

export const customerOrderSummarySelect = Prisma.validator<Prisma.OrderSelect>()({
  ...customerOrderScalarSelect,
  items: { select: customerOrderItemSelect },
  location: { select: customerLocationSelect },
});

export class OrderCancellationStateError extends Error {
  constructor() {
    super('Order cannot be cancelled at this stage');
    this.name = 'OrderCancellationStateError';
  }
}

export class OrdersService {
  async createOrder(userId: string, orderData: CreateOrderInput) {
    const { locationId, orderType, items, ...customerData } = orderData;

    // Validate location
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || !location.acceptsOrders) {
      throw new Error('Location not accepting orders');
    }

    // Calculate prices
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: true,
                },
              },
            },
          },
        },
      });

      if (!menuItem || !menuItem.isAvailable || menuItem.is86ed) {
        throw new Error(`Menu item ${item.menuItemId} is not available`);
      }

      let itemTotal = menuItem.price.toNumber() * item.quantity;

      // Calculate modifiers
      const itemModifiers = [];
      for (const mod of item.modifiers) {
        const modifier = await prisma.modifier.findUnique({ where: { id: mod.modifierId } });
        if (!modifier || !modifier.isAvailable) {
          throw new Error(`Modifier ${mod.modifierId} is not available`);
        }

        const modTotal = modifier.price.toNumber() * mod.quantity * item.quantity;
        itemTotal += modTotal;

        itemModifiers.push({
          modifierId: mod.modifierId,
          quantity: mod.quantity,
          unitPrice: modifier.price,
          totalPrice: new Decimal(modTotal),
        });
      }

      subtotal += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: new Decimal(itemTotal),
        specialInstructions: item.specialInstructions,
        modifiers: {
          create: itemModifiers,
        },
      });
    }

    const tax = calculateTax(subtotal, config.TAX_RATE);
    const deliveryFee = orderType === 'delivery' ? (orderData.deliveryAddress ? 5.99 : 0) : 0;
    const tip = orderData.tip || 0;
    const discount = 0;
    const loyaltyDiscount = 0; // Calculate if points redeemed

    const total = calculateOrderTotal(subtotal, tax, deliveryFee, tip, discount + loyaltyDiscount);

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        locationId,
        orderType,
        status: 'pending',
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        deliveryFee: new Decimal(deliveryFee),
        tip: new Decimal(tip),
        discount: new Decimal(discount),
        loyaltyDiscount: new Decimal(loyaltyDiscount),
        total: new Decimal(total),
        customerName: customerData.customerName,
        customerEmail: customerData.customerEmail,
        customerPhone: customerData.customerPhone,
        deliveryAddress1: orderData.deliveryAddress?.address1,
        deliveryAddress2: orderData.deliveryAddress?.address2,
        deliveryCity: orderData.deliveryAddress?.city,
        deliveryState: orderData.deliveryAddress?.state,
        deliveryZipCode: orderData.deliveryAddress?.zipCode,
        deliveryNotes: orderData.deliveryAddress?.deliveryNotes,
        scheduledFor: orderData.scheduledFor ? new Date(orderData.scheduledFor) : undefined,
        specialInstructions: orderData.specialInstructions,
        items: {
          create: orderItems,
        },
        statusHistory: {
          create: {
            status: 'pending',
            note: 'Order created',
          },
        },
      },
      select: customerOrderMutationSelect,
    });

    // Send confirmation email
    await emailService.sendOrderConfirmation(order).catch((err) => {
      console.error('Failed to send order confirmation email:', err);
    });

    return order;
  }

  async getOrderForUser(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: customerOrderSelect,
    });

    return order;
  }

  async getUserOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        select: customerOrderSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { orders, total, page, limit };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string, changedBy?: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            note,
            changedBy,
          },
        },
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
        ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
      },
      include: {
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

    // Send status update email
    await emailService.sendOrderStatusUpdate(order, status).catch((err) => {
      console.error('Failed to send status update email:', err);
    });

    // If completed, award loyalty points
    if (status === 'completed' && order.userId) {
      await loyaltyService.awardPointsForOrder(order.userId, order.id, order.total.toNumber());
    }

    return order;
  }

  async cancelOrderForUser(orderId: string, userId: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: { status: true },
    });

    if (!order) {
      return null;
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new OrderCancellationStateError();
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId, userId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            status: 'cancelled',
            note: reason,
            changedBy: userId,
          },
        },
      },
      select: customerOrderMutationSelect,
    });

    await emailService.sendOrderStatusUpdate(cancelledOrder, 'cancelled').catch(() => {
      console.error('Failed to send status update email');
    });

    return cancelledOrder;
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${dateStr}${random}`;
  }

  async getLocationOrders(locationId: string, status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      locationId,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }
}

export const ordersService = new OrdersService();
