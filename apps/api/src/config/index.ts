import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const disabledByDefaultFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const configSchema = z
  .object({
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
  MAGIC_LINK_EXPIRY_MINUTES: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().finite())
    .default('15'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Dormant custom ordering/payment runtime
  CUSTOM_ORDERING_ENABLED: disabledByDefaultFlag,
  CUSTOM_PAYMENT_ENABLED: disabledByDefaultFlag,
  ACCOUNTS_ENABLED: disabledByDefaultFlag,

  // Shift4 Payments
  SHIFT4_API_KEY: z.string().default(''),
  SHIFT4_API_SECRET: z.string().default(''),
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
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  SES_FROM_EMAIL: z.string().default(''),
  SES_FROM_NAME: z.string().default("Milano's Pizzas"),

  // Tax
  TAX_RATE: z.string().transform(Number).default('0.0825'),

  // Loyalty
  LOYALTY_POINTS_PER_DOLLAR: z.string().transform(Number).default('10'),
  LOYALTY_DOLLARS_PER_POINT: z.string().transform(Number).default('0.01'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  })
  .superRefine((value, context) => {
    if (value.ACCOUNTS_ENABLED) {
      if (!value.CUSTOM_ORDERING_ENABLED) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CUSTOM_ORDERING_ENABLED'],
          message: 'Custom ordering must be enabled before customer accounts can be enabled',
        });
      }

      if (!value.AWS_ACCESS_KEY_ID || !value.AWS_SECRET_ACCESS_KEY) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ACCOUNTS_ENABLED'],
          message: 'Email service credentials are required only when accounts are enabled',
        });
      }

      if (!z.string().email().safeParse(value.SES_FROM_EMAIL).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SES_FROM_EMAIL'],
          message: 'A valid sender email is required only when accounts are enabled',
        });
      }
    }

    if (!value.CUSTOM_PAYMENT_ENABLED) {
      return;
    }

    if (!value.CUSTOM_ORDERING_ENABLED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CUSTOM_ORDERING_ENABLED'],
        message: 'Custom ordering must be enabled before custom payment can be enabled',
      });
    }

    if (!value.SHIFT4_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SHIFT4_API_KEY'],
        message: 'Shift4 credentials are required only when custom payment is explicitly enabled',
      });
    }

    if (!value.SHIFT4_API_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SHIFT4_API_SECRET'],
        message: 'Shift4 credentials are required only when custom payment is explicitly enabled',
      });
    }
  });

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;
