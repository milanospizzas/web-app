import { z } from 'zod';
import { REGEX_PATTERNS } from '../constants';

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirectUrl: z.string().url().optional(),
});

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(REGEX_PATTERNS.PHONE, 'Invalid phone number').optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkVerifyInput = z.infer<typeof magicLinkVerifySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
