// Order Types
export const ORDER_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
  DINE_IN: 'dine-in',
} as const;

export type OrderType = typeof ORDER_TYPES[keyof typeof ORDER_TYPES];

// Order Statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// Payment Transaction Types
export const PAYMENT_TRANSACTION_TYPES = {
  SALE: 'sale',
  REFUND: 'refund',
  VOID: 'void',
} as const;

export type PaymentTransactionType = typeof PAYMENT_TRANSACTION_TYPES[keyof typeof PAYMENT_TRANSACTION_TYPES];

// Payment Statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  COMPLETED: 'completed',
  FAILED: 'failed',
  VOIDED: 'voided',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

// Loyalty Tiers
export const LOYALTY_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export type LoyaltyTier = typeof LOYALTY_TIERS[keyof typeof LOYALTY_TIERS];

// Loyalty Event Types
export const LOYALTY_EVENT_TYPES = {
  EARN: 'earn',
  REDEEM: 'redeem',
  EXPIRE: 'expire',
  BONUS: 'bonus',
  REFERRAL: 'referral',
  BIRTHDAY: 'birthday',
} as const;

export type LoyaltyEventType = typeof LOYALTY_EVENT_TYPES[keyof typeof LOYALTY_EVENT_TYPES];

// Loyalty Configuration
export const LOYALTY_CONFIG = {
  POINTS_PER_DOLLAR: 10,
  TIER_THRESHOLDS: {
    BRONZE: 0,
    SILVER: 500,
    GOLD: 2000,
    PLATINUM: 5000,
  },
  TIER_MULTIPLIERS: {
    BRONZE: 1,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2,
  },
  REFERRAL_REWARD_REFERRER: 500,
  REFERRAL_REWARD_REFERRED: 250,
  BIRTHDAY_REWARD_POINTS: 1000,
  POINTS_EXPIRY_DAYS: 365,
} as const;

// Cart Status
export const CART_STATUSES = {
  ACTIVE: 'active',
  CONVERTED: 'converted',
  ABANDONED: 'abandoned',
} as const;

export type CartStatus = typeof CART_STATUSES[keyof typeof CART_STATUSES];

// POS Sync Statuses
export const POS_SYNC_STATUSES = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;

export type PosSyncStatus = typeof POS_SYNC_STATUSES[keyof typeof POS_SYNC_STATUSES];

// Email Statuses
export const EMAIL_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced',
} as const;

export type EmailStatus = typeof EMAIL_STATUSES[keyof typeof EMAIL_STATUSES];

// Catering Request Statuses
export const CATERING_STATUSES = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type CateringStatus = typeof CATERING_STATUSES[keyof typeof CATERING_STATUSES];

// Days of Week
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Business logic errors
  MENU_ITEM_UNAVAILABLE: 'MENU_ITEM_UNAVAILABLE',
  DELIVERY_ZONE_NOT_FOUND: 'DELIVERY_ZONE_NOT_FOUND',
  INSUFFICIENT_LOYALTY_POINTS: 'INSUFFICIENT_LOYALTY_POINTS',
  ORDER_CANNOT_BE_CANCELLED: 'ORDER_CANNOT_BE_CANCELLED',

  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_INVALID_AMOUNT: 'PAYMENT_INVALID_AMOUNT',

  // System errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  MENU_UPDATED: 'Menu updated successfully',
  USER_UPDATED: 'User profile updated successfully',
  LOYALTY_POINTS_EARNED: 'Loyalty points earned',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?1?\d{10,14}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
} as const;

// Shift4 Configuration
export const SHIFT4_CONFIG = {
  API_BASE_URL: 'https://api.shift4.com',
  SANDBOX_API_BASE_URL: 'https://api.shift4test.com',
  I4GO_PRODUCTION_URL: 'https://i4go.shift4.com/checkout',
  I4GO_SANDBOX_URL: 'https://i4go-sandbox.shift4.com/checkout',
  MAX_INVOICE_NUMBER: 9999999999, // 10 digits max
  TIMEOUT_MS: 30000,
} as const;

// API Configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  SESSION_EXPIRY_HOURS: 24 * 30, // 30 days
  MAGIC_LINK_EXPIRY_MINUTES: 15,
  CART_EXPIRY_HOURS: 24,
} as const;
