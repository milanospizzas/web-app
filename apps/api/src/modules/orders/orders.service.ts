import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../shared/database/prisma';
import { config } from '../../config';
import { emailService } from '../email/email.service';
import { loyaltyService } from '../loyalty/loyalty.service';
import { shift4Service } from '../payments/shift4.service';
import { calculateTax, calculateOrderTotal } from '@milanos/shared';
import type { CreateOrderInput, OrderStatus } from '@milanos/shared';

export class OrdersService {
  async createOrder(userId: string | undefined, orderData: CreateOrderInput) {
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
    const deliveryFee = orderType === 'delivery' ? orderData.deliveryAddress ? 5.99 : 0 : 0;
    const tip = orderData.tip || 0;
    const discount = 0;
    const loyaltyDiscount = 0; // Calculate if points redeemed

    const total = calculateOrderTotal(subtotal, tax, deliveryFee, tip, discount + loyaltyDiscount);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

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

    // Send confirmation email
    await emailService.sendOrderConfirmation(order).catch((err) => {
      console.error('Failed to send order confirmation email:', err);
    });

    return order;
  }

  async getOrder(orderId: string, userId?: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(userId ? { userId } : {}),
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
        payments: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return order;
  }

  async getUserOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          location: true,
        },
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

  async cancelOrder(orderId: string, userId?: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(userId ? { userId } : {}),
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    return this.updateOrderStatus(orderId, 'cancelled', reason, userId);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${dateStr}${random}`;
  }

  async getLocationOrders(locationId: string, status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const where: any = { locationId };
    if (status) {
      where.status = status;
    }

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
