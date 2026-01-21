import type { OrderType, OrderStatus } from '../constants';

export interface Order {
  id: string;
  orderNumber: string;
  locationId: string;
  orderType: OrderType;
  status: OrderStatus;

  // Pricing
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  loyaltyDiscount: number;
  total: number;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Delivery details
  deliveryAddress1?: string;
  deliveryAddress2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZipCode?: string;
  deliveryNotes?: string;

  // Timing
  scheduledFor?: string;
  estimatedReadyAt?: string;
  estimatedDeliveryAt?: string;

  // Special instructions
  specialInstructions?: string;

  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  modifiers: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  modifierId: string;
  modifierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  locationId: string;
  orderType: OrderType;
  items: CreateOrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddressId?: string;
  deliveryAddress?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    deliveryNotes?: string;
  };
  scheduledFor?: string;
  specialInstructions?: string;
  tip?: number;
  loyaltyPointsToRedeem?: number;
}

export interface CreateOrderItem {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers: CreateOrderItemModifier[];
}

export interface CreateOrderItemModifier {
  modifierId: string;
  quantity: number;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  note?: string;
}
