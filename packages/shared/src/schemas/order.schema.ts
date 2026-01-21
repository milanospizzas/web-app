import { z } from 'zod';
import { ORDER_TYPES, ORDER_STATUSES, REGEX_PATTERNS } from '../constants';

export const createOrderItemModifierSchema = z.object({
  modifierId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().max(500).optional(),
  modifiers: z.array(createOrderItemModifierSchema).default([]),
});

export const deliveryAddressSchema = z.object({
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().regex(REGEX_PATTERNS.ZIP_CODE, 'Invalid ZIP code'),
  deliveryNotes: z.string().max(500).optional(),
});

export const createOrderSchema = z.object({
  locationId: z.string().min(1),
  orderType: z.enum([ORDER_TYPES.DELIVERY, ORDER_TYPES.PICKUP, ORDER_TYPES.DINE_IN]),
  items: z.array(createOrderItemSchema).min(1),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(REGEX_PATTERNS.PHONE, 'Invalid phone number'),
  deliveryAddressId: z.string().optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  scheduledFor: z.string().datetime().optional(),
  specialInstructions: z.string().max(1000).optional(),
  tip: z.number().nonnegative().optional(),
  loyaltyPointsToRedeem: z.number().int().nonnegative().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.READY,
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.CANCELLED,
  ]),
  note: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  orderType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateOrderItemModifierInput = z.infer<typeof createOrderItemModifierSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
