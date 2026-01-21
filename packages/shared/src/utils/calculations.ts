import { LOYALTY_CONFIG } from '../constants';
import type { LoyaltyTier } from '../constants';

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  tax: number,
  deliveryFee: number,
  tip: number,
  discount: number
): number {
  return Math.round((subtotal + tax + deliveryFee + tip - discount) * 100) / 100;
}

/**
 * Calculate loyalty points earned for an order
 */
export function calculateLoyaltyPoints(
  orderTotal: number,
  tier: LoyaltyTier = 'bronze'
): number {
  const basePoints = Math.floor(orderTotal * LOYALTY_CONFIG.POINTS_PER_DOLLAR);
  const multiplier = LOYALTY_CONFIG.TIER_MULTIPLIERS[tier.toUpperCase() as keyof typeof LOYALTY_CONFIG.TIER_MULTIPLIERS];
  return Math.floor(basePoints * multiplier);
}

/**
 * Calculate discount amount from loyalty points
 */
export function calculateLoyaltyDiscount(points: number, dollarsPerPoint = 0.01): number {
  return Math.round(points * dollarsPerPoint * 100) / 100;
}

/**
 * Determine loyalty tier based on lifetime points
 */
export function getLoyaltyTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= LOYALTY_CONFIG.TIER_THRESHOLDS.PLATINUM) return 'platinum';
  if (lifetimePoints >= LOYALTY_CONFIG.TIER_THRESHOLDS.GOLD) return 'gold';
  if (lifetimePoints >= LOYALTY_CONFIG.TIER_THRESHOLDS.SILVER) return 'silver';
  return 'bronze';
}

/**
 * Calculate estimated delivery time based on distance
 */
export function calculateDeliveryTime(distanceMiles: number, baseTimeMinutes = 30): number {
  // Add 5 minutes per mile beyond first 2 miles
  const additionalMiles = Math.max(0, distanceMiles - 2);
  return Math.ceil(baseTimeMinutes + additionalMiles * 5);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
