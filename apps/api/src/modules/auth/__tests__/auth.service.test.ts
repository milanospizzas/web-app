import type { User } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  createUser: vi.fn(),
  createLoyaltyAccount: vi.fn(),
  createMagicLink: vi.fn(),
  sendMagicLink: vi.fn(),
  nanoid: vi.fn(),
}));

vi.mock('../../../shared/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUser,
      create: mocks.createUser,
    },
    loyaltyAccount: { create: mocks.createLoyaltyAccount },
    authMagicLink: { create: mocks.createMagicLink },
  },
}));

vi.mock('../../email/email.service', () => ({
  emailService: { sendMagicLink: mocks.sendMagicLink },
}));

vi.mock('nanoid', () => ({ nanoid: mocks.nanoid }));

import { config } from '../../../config';
import { AuthService } from '../auth.service';

const fixedNow = new Date('2026-08-25T12:00:00.000Z');
const generatedToken = 'synthetic-generated-magic-link-value';
const existingUser: User = {
  id: 'synthetic-user-id',
  email: 'existing@example.test',
  phone: null,
  firstName: null,
  lastName: null,
  dateOfBirth: null,
  emailVerified: false,
  phoneVerified: false,
  isActive: true,
  isAdmin: false,
  lastLoginAt: null,
  createdAt: fixedNow,
  updatedAt: fixedNow,
};

describe('AuthService.sendMagicLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    mocks.nanoid.mockReturnValue(generatedToken);
  });

  it('expires an existing user magic link after 15 minutes independent of session lifetime', async () => {
    mocks.findUser.mockResolvedValue(existingUser);

    await new AuthService().sendMagicLink(existingUser.email);

    expect(config.SESSION_EXPIRY_HOURS).toBe(720);
    expect(mocks.createMagicLink).toHaveBeenCalledWith({
      data: {
        userId: existingUser.id,
        token: generatedToken,
        email: existingUser.email,
        expiresAt: new Date(fixedNow.getTime() + 15 * 60 * 1000),
      },
    });
    expect(mocks.sendMagicLink).toHaveBeenCalledWith(
      existingUser.email,
      generatedToken,
      undefined
    );
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it('creates a user and loyalty account before issuing the same 15-minute link', async () => {
    const newUser = { ...existingUser, id: 'synthetic-new-user-id', email: 'new@example.test' };
    mocks.findUser.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue(newUser);

    await new AuthService().sendMagicLink(newUser.email, 'https://example.test/continue');

    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.createLoyaltyAccount).toHaveBeenCalledOnce();
    expect(mocks.createMagicLink).toHaveBeenCalledWith({
      data: {
        userId: newUser.id,
        token: generatedToken,
        email: newUser.email,
        expiresAt: new Date(fixedNow.getTime() + 15 * 60 * 1000),
      },
    });
    expect(mocks.sendMagicLink).toHaveBeenCalledWith(
      newUser.email,
      generatedToken,
      'https://example.test/continue'
    );
  });
});
