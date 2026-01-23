// SkyTab POS (Shift4 Conecto API) Types
// Based on Shift4 Marketplace API documentation

// ==================== Authentication ====================

export interface SkyTabAccessTokenRequest {
  credential: {
    apiKey: string;
    apiSecret: string;
  };
}

export interface SkyTabAccessTokenResponse {
  result: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

// ==================== Menu Types ====================

export interface SkyTabMenuItem {
  guid: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  categoryGuid: string;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
  imageUrl?: string;
  calories?: number;
  prepTimeMinutes?: number;
  tags?: string[];
  allergens?: string[];
  modifierGroups?: SkyTabMenuItemModifierGroup[];
}

export interface SkyTabMenuCategory {
  guid: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  parentCategoryGuid?: string;
  imageUrl?: string;
}

export interface SkyTabModifierGroup {
  guid: string;
  name: string;
  description?: string;
  minSelection: number;
  maxSelection?: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers: SkyTabModifier[];
}

export interface SkyTabModifier {
  guid: string;
  name: string;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
  groupGuid: string;
}

export interface SkyTabMenuItemModifierGroup {
  modifierGroupGuid: string;
  sortOrder: number;
}

export interface SkyTabMenuResponse {
  result: {
    menu: {
      guid: string;
      name: string;
      locationGuid: string;
      categories: SkyTabMenuCategory[];
      items: SkyTabMenuItem[];
      modifierGroups: SkyTabModifierGroup[];
      lastModified: string;
    };
  };
}

export interface SkyTabMenuUpdatesResponse {
  result: {
    updates: {
      categories: SkyTabMenuCategory[];
      items: SkyTabMenuItem[];
      modifierGroups: SkyTabModifierGroup[];
      deletedCategoryGuids: string[];
      deletedItemGuids: string[];
      deletedModifierGroupGuids: string[];
      lastModified: string;
    };
  };
}

// ==================== Ticket/Order Types ====================

export interface SkyTabTicketItem {
  itemGuid: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  modifiers?: SkyTabTicketModifier[];
}

export interface SkyTabTicketModifier {
  modifierGuid: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SkyTabCreateTicketRequest {
  ticket: {
    externalReference: string;
    orderNumber: string;
    orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    items: SkyTabTicketItem[];
    subtotal: number;
    tax: number;
    total: number;
    tip?: number;
    scheduledFor?: string; // ISO 8601 datetime
    specialInstructions?: string;
    deliveryAddress?: {
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
      deliveryNotes?: string;
    };
  };
}

export interface SkyTabCreateTicketResponse {
  result: {
    ticket: {
      guid: string;
      externalReference: string;
      orderNumber: string;
      status: SkyTabTicketStatus;
      estimatedReadyTime?: string;
      createdAt: string;
    };
  };
}

export type SkyTabTicketStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SkyTabTicketStatusResponse {
  result: {
    ticket: {
      guid: string;
      externalReference: string;
      status: SkyTabTicketStatus;
      estimatedReadyTime?: string;
      updatedAt: string;
    };
  };
}

export interface SkyTabCancelTicketRequest {
  reason?: string;
}

export interface SkyTabCancelTicketResponse {
  result: {
    success: boolean;
    ticket: {
      guid: string;
      status: 'CANCELLED';
    };
  };
}

// ==================== Stock/Inventory Types ====================

export interface SkyTabStockStatusItem {
  itemGuid: string;
  sku?: string;
  isAvailable: boolean;
  stockLevel?: number;
  lastUpdated: string;
}

export interface SkyTabStockStatusResponse {
  result: {
    items: SkyTabStockStatusItem[];
    lastUpdated: string;
  };
}

export interface SkyTabUpdateStockRequest {
  itemGuid: string;
  isAvailable: boolean;
  stockLevel?: number;
}

export interface SkyTabUpdateStockResponse {
  result: {
    success: boolean;
    item: SkyTabStockStatusItem;
  };
}

// ==================== Webhook Types ====================

export type SkyTabWebhookEventType =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.status_changed'
  | 'ticket.cancelled'
  | 'menu.updated'
  | 'menu.item_availability_changed'
  | 'stock.updated'
  | 'location.hours_changed';

export interface SkyTabWebhookPayload {
  eventType: SkyTabWebhookEventType;
  eventId: string;
  timestamp: string;
  locationGuid: string;
  data: SkyTabWebhookData;
  signature: string;
}

export type SkyTabWebhookData =
  | SkyTabTicketWebhookData
  | SkyTabMenuWebhookData
  | SkyTabStockWebhookData
  | SkyTabLocationWebhookData;

export interface SkyTabTicketWebhookData {
  ticketGuid: string;
  externalReference: string;
  status: SkyTabTicketStatus;
  previousStatus?: SkyTabTicketStatus;
  estimatedReadyTime?: string;
  cancellationReason?: string;
}

export interface SkyTabMenuWebhookData {
  menuGuid: string;
  changedItems?: string[];
  changedCategories?: string[];
  changedModifierGroups?: string[];
}

export interface SkyTabStockWebhookData {
  items: Array<{
    itemGuid: string;
    isAvailable: boolean;
    stockLevel?: number;
  }>;
}

export interface SkyTabLocationWebhookData {
  locationGuid: string;
  isOpen: boolean;
  nextOpenTime?: string;
  nextCloseTime?: string;
}

// ==================== Error Types ====================

export interface SkyTabErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type SkyTabErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_REQUEST'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TICKET_NOT_FOUND'
  | 'INVALID_TICKET_STATUS'
  | 'MENU_SYNC_FAILED'
  | 'STOCK_UPDATE_FAILED';

// ==================== Location Types ====================

export interface SkyTabLocation {
  guid: string;
  name: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  timezone: string;
  isActive: boolean;
  operatingHours: SkyTabOperatingHours[];
}

export interface SkyTabOperatingHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
}

export interface SkyTabLocationResponse {
  result: {
    location: SkyTabLocation;
  };
}

// ==================== API Request Options ====================

export interface SkyTabRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
