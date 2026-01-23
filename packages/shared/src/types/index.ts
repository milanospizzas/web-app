// Re-export from modules
export * from './api';
export * from './menu';
export * from './order';
export * from './payment';
export * from './loyalty';
export * from './user';
export * from './skytab';

// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  acceptsOrders: boolean;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsDineIn: boolean;
}

export interface Address {
  id: string;
  label?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryNotes?: string;
  isDefault: boolean;
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  zipCodes: string[];
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: number;
  isActive: boolean;
}
