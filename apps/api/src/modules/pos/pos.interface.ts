// POS Provider Interface
// This interface defines the contract that all POS providers must implement

export interface POSMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  sku?: string;
  isAvailable: boolean;
}

export interface POSModifier {
  id: string;
  name: string;
  price: number;
  groupId: string;
  isAvailable: boolean;
}

export interface POSOrder {
  externalOrderId: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  customerName: string;
  customerPhone: string;
  items: POSOrderItem[];
  total: number;
  scheduledFor?: Date;
  specialInstructions?: string;
}

export interface POSOrderItem {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers: POSOrderModifier[];
}

export interface POSOrderModifier {
  modifierId: string;
  quantity: number;
}

export interface POSOrderStatus {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  estimatedReadyTime?: Date;
}

export interface POSProvider {
  // Authentication
  authenticate(): Promise<boolean>;

  // Menu Sync
  syncFullMenu(locationId: string): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }>;
  syncMenuUpdates(locationId: string, since: Date): Promise<{
    items: POSMenuItem[];
    modifiers: POSModifier[];
  }>;

  // Order Management
  sendOrder(order: POSOrder): Promise<{ posOrderId: string; success: boolean }>;
  getOrderStatus(posOrderId: string): Promise<POSOrderStatus>;
  cancelOrder(posOrderId: string): Promise<boolean>;

  // Item Availability (86'ing)
  updateItemAvailability(itemId: string, isAvailable: boolean): Promise<boolean>;
  getUnavailableItems(locationId: string): Promise<string[]>;
}
