import { prisma } from '../../shared/database/prisma';
import {
  calculateLoyaltyPoints,
  getLoyaltyTier,
  LOYALTY_CONFIG,
  generateReferralCode,
  type LoyaltyTier,
} from '@milanos/shared';

export class LoyaltyService {
  async getLoyaltyAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        stampCards: {
          where: { status: { in: ['active', 'completed'] } },
        },
        rewards: {
          where: { status: 'available' },
        },
      },
    });

    if (!account) {
      // Create account if it doesn't exist
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          pointsBalance: 0,
          lifetimePoints: 0,
          currentTier: 'bronze',
          referralCode: generateReferralCode(userId),
        },
        include: {
          events: true,
          stampCards: true,
          rewards: true,
        },
      });
    }

    return account;
  }

  async awardPointsForOrder(userId: string, orderId: string, orderTotal: number) {
    const account = await this.getLoyaltyAccount(userId);
    const points = calculateLoyaltyPoints(orderTotal, account.currentTier as LoyaltyTier);

    // Check if order already awarded points
    const existingEvent = await prisma.loyaltyEvent.findFirst({
      where: { accountId: account.id, orderId },
    });

    if (existingEvent) {
      return account; // Already awarded
    }

    // Award points
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_CONFIG.POINTS_EXPIRY_DAYS);

    await prisma.loyaltyEvent.create({
      data: {
        accountId: account.id,
        orderId,
        eventType: 'earn',
        points,
        description: `Earned ${points} points from order`,
        expiresAt,
      },
    });

    // Update account balance
    const newLifetimePoints = account.lifetimePoints + points;
    const newTier = getLoyaltyTier(newLifetimePoints);

    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: account.pointsBalance + points,
        lifetimePoints: newLifetimePoints,
        currentTier: newTier,
        ...(newTier !== account.currentTier ? { tierStartDate: new Date() } : {}),
      },
    });

    return account;
  }

  async redeemPoints(userId: string, points: number, description: string) {
    const account = await this.getLoyaltyAccount(userId);

    if (account.pointsBalance < points) {
      throw new Error('Insufficient points');
    }

    // Create redemption event
    await prisma.loyaltyEvent.create({
      data: {
        accountId: account.id,
        eventType: 'redeem',
        points: -points,
        description,
      },
    });

    // Update balance
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: account.pointsBalance - points,
      },
    });

    return account;
  }

  async createReferral(referrerUserId: string, referredEmail: string) {
    const referrer = await prisma.user.findUnique({ where: { id: referrerUserId } });
    if (!referrer) {
      throw new Error('Referrer not found');
    }

    const referrerAccount = await this.getLoyaltyAccount(referrerUserId);

    // Check if already referred
    const existing = await prisma.referralInvite.findFirst({
      where: {
        referrerUserId,
        referredEmail,
      },
    });

    if (existing) {
      return existing;
    }

    const code = `${referrerAccount.referralCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invite = await prisma.referralInvite.create({
      data: {
        referrerUserId,
        referredEmail,
        code,
        status: 'pending',
        referrerReward: LOYALTY_CONFIG.REFERRAL_REWARD_REFERRER,
        referredReward: LOYALTY_CONFIG.REFERRAL_REWARD_REFERRED,
        expiresAt,
      },
    });

    return invite;
  }

  async completeReferral(code: string, referredUserId: string) {
    const invite = await prisma.referralInvite.findUnique({
      where: { code },
      include: { referrerUser: true },
    });

    if (!invite) {
      throw new Error('Invalid referral code');
    }

    if (invite.status !== 'pending') {
      throw new Error('Referral already completed');
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error('Referral code expired');
    }

    // Update invite
    await prisma.referralInvite.update({
      where: { id: invite.id },
      data: {
        referredUserId,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Award points to referrer
    const referrerAccount = await this.getLoyaltyAccount(invite.referrerUserId);
    await prisma.loyaltyEvent.create({
      data: {
        accountId: referrerAccount.id,
        eventType: 'referral',
        points: invite.referrerReward,
        description: `Referral reward for inviting ${invite.referredEmail}`,
      },
    });

    await prisma.loyaltyAccount.update({
      where: { id: referrerAccount.id },
      data: {
        pointsBalance: referrerAccount.pointsBalance + invite.referrerReward,
        lifetimePoints: referrerAccount.lifetimePoints + invite.referrerReward,
      },
    });

    // Award points to referred user
    const referredAccount = await this.getLoyaltyAccount(referredUserId);
    await prisma.loyaltyEvent.create({
      data: {
        accountId: referredAccount.id,
        eventType: 'referral',
        points: invite.referredReward,
        description: `Welcome bonus from referral`,
      },
    });

    await prisma.loyaltyAccount.update({
      where: { id: referredAccount.id },
      data: {
        pointsBalance: referredAccount.pointsBalance + invite.referredReward,
        lifetimePoints: referredAccount.lifetimePoints + invite.referredReward,
      },
    });

    return invite;
  }

  async addStamp(userId: string, cardType: string) {
    const account = await this.getLoyaltyAccount(userId);

    // Find active stamp card
    let stampCard = await prisma.stampCard.findFirst({
      where: {
        accountId: account.id,
        cardType,
        status: 'active',
      },
    });

    // Create new card if none exists
    if (!stampCard) {
      stampCard = await prisma.stampCard.create({
        data: {
          accountId: account.id,
          cardType,
          stampsRequired: 10,
          stampsEarned: 0,
          status: 'active',
        },
      });
    }

    // Add stamp
    const newStampCount = stampCard.stampsEarned + 1;
    const completed = newStampCount >= stampCard.stampsRequired;

    await prisma.stampCard.update({
      where: { id: stampCard.id },
      data: {
        stampsEarned: newStampCount,
        ...(completed
          ? {
              status: 'completed',
              completedAt: new Date(),
            }
          : {}),
      },
    });

    return stampCard;
  }

  async awardBirthdayReward(userId: string) {
    const account = await this.getLoyaltyAccount(userId);

    // Check if already awarded this year
    const thisYear = new Date().getFullYear();
    const existingReward = await prisma.loyaltyEvent.findFirst({
      where: {
        accountId: account.id,
        eventType: 'birthday',
        createdAt: {
          gte: new Date(`${thisYear}-01-01`),
        },
      },
    });

    if (existingReward) {
      return null; // Already awarded
    }

    // Award birthday points
    await prisma.loyaltyEvent.create({
      data: {
        accountId: account.id,
        eventType: 'birthday',
        points: LOYALTY_CONFIG.BIRTHDAY_REWARD_POINTS,
        description: 'Birthday reward',
      },
    });

    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: account.pointsBalance + LOYALTY_CONFIG.BIRTHDAY_REWARD_POINTS,
        lifetimePoints: account.lifetimePoints + LOYALTY_CONFIG.BIRTHDAY_REWARD_POINTS,
      },
    });

    return LOYALTY_CONFIG.BIRTHDAY_REWARD_POINTS;
  }
}

export const loyaltyService = new LoyaltyService();
