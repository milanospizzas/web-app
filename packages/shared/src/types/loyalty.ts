import type { LoyaltyTier, LoyaltyEventType } from '../constants';

export interface LoyaltyAccount {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: LoyaltyTier;
  tierStartDate: string;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyEvent {
  id: string;
  accountId: string;
  orderId?: string;
  eventType: LoyaltyEventType;
  points: number;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

export interface StampCard {
  id: string;
  cardType: string;
  stampsRequired: number;
  stampsEarned: number;
  status: 'active' | 'completed' | 'redeemed';
  completedAt?: string;
  redeemedAt?: string;
  expiresAt?: string;
}

export interface LoyaltyReward {
  id: string;
  rewardType: string;
  name: string;
  description?: string;
  pointsCost?: number;
  discountAmount?: number;
  discountPercent?: number;
  status: 'available' | 'redeemed' | 'expired';
  redeemedAt?: string;
  expiresAt?: string;
}

export interface ReferralInvite {
  id: string;
  referredEmail: string;
  code: string;
  status: 'pending' | 'completed' | 'expired';
  referrerReward: number;
  referredReward: number;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateReferralRequest {
  email: string;
}

export interface RedeemPointsRequest {
  orderId: string;
  points: number;
}
