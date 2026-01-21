import { nanoid } from 'nanoid';
import { prisma } from '../../shared/database/prisma';
import { config } from '../../config';
import { emailService } from '../email/email.service';
import { generateReferralCode } from '@milanos/shared';

export class AuthService {
  async sendMagicLink(email: string, redirectUrl?: string) {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: false,
          isActive: true,
          isAdmin: false,
        },
      });

      // Create loyalty account for new users
      await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          pointsBalance: 0,
          lifetimePoints: 0,
          currentTier: 'bronze',
          referralCode: generateReferralCode(user.id),
        },
      });
    }

    // Generate magic link token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + config.SESSION_EXPIRY_HOURS * 15 * 60 * 1000); // 15 minutes

    await prisma.authMagicLink.create({
      data: {
        userId: user.id,
        token,
        email,
        expiresAt,
      },
    });

    // Send email
    await emailService.sendMagicLink(email, token, redirectUrl);

    return { success: true };
  }

  async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string) {
    const magicLink = await prisma.authMagicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new Error('Invalid magic link');
    }

    if (magicLink.usedAt) {
      throw new Error('Magic link already used');
    }

    if (new Date(magicLink.expiresAt) < new Date()) {
      throw new Error('Magic link expired');
    }

    // Mark magic link as used
    await prisma.authMagicLink.update({
      where: { id: magicLink.id },
      data: {
        usedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // Create session
    const sessionToken = nanoid(64);
    const sessionExpiresAt = new Date(
      Date.now() + config.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const session = await prisma.session.create({
      data: {
        userId: magicLink.user.id,
        token: sessionToken,
        expiresAt: sessionExpiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Update user's last login
    await prisma.user.update({
      where: { id: magicLink.user.id },
      data: {
        lastLoginAt: new Date(),
        emailVerified: true,
      },
    });

    return {
      user: magicLink.user,
      session,
    };
  }

  async logout(sessionToken: string) {
    await prisma.session.delete({ where: { token: sessionToken } });
    return { success: true };
  }

  async getSession(sessionToken: string) {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt) < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return session;
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        loyaltyAccount: {
          include: {
            stampCards: {
              where: { status: 'active' },
            },
            rewards: {
              where: { status: 'available' },
            },
          },
        },
      },
    });

    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: Date;
    }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return user;
  }
}

export const authService = new AuthService();
