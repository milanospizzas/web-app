import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // Session
  SESSION_SECRET: z.string(),
  SESSION_EXPIRY_HOURS: z.string().transform(Number).default('720'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Shift4 Payments
  SHIFT4_API_KEY: z.string(),
  SHIFT4_API_SECRET: z.string(),
  SHIFT4_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  SHIFT4_CLERK_ID: z.string().default('1'),

  // SkyTab POS (Shift4 Conecto API)
  SKYTAB_API_KEY: z.string().optional(),
  SKYTAB_API_SECRET: z.string().optional(),
  SKYTAB_LOCATION_ID: z.string().optional(),
  SKYTAB_WEBHOOK_SECRET: z.string().optional(),
  SKYTAB_SYNC_INTERVAL_MINUTES: z.string().transform(Number).default('5'),

  // AWS SES
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  SES_FROM_EMAIL: z.string().email(),
  SES_FROM_NAME: z.string().default("Milano's Pizza"),

  // Tax
  TAX_RATE: z.string().transform(Number).default('0.0825'),

  // Loyalty
  LOYALTY_POINTS_PER_DOLLAR: z.string().transform(Number).default('10'),
  LOYALTY_DOLLARS_PER_POINT: z.string().transform(Number).default('0.01'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;
