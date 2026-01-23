import { vi, afterAll, afterEach } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SHIFT4_API_KEY = 'test-api-key';
process.env.SHIFT4_API_SECRET = 'test-api-secret';
process.env.SHIFT4_ENVIRONMENT = 'sandbox';
process.env.SHIFT4_CLERK_ID = '1';
process.env.SKYTAB_API_KEY = 'test-skytab-api-key';
process.env.SKYTAB_API_SECRET = 'test-skytab-api-secret';
process.env.SKYTAB_LOCATION_ID = 'test-location-guid';
process.env.SKYTAB_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.SKYTAB_SYNC_INTERVAL_MINUTES = '5';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.SES_FROM_EMAIL = 'test@example.com';
process.env.SES_FROM_NAME = 'Test';
process.env.TAX_RATE = '0.0825';
process.env.LOYALTY_POINTS_PER_DOLLAR = '10';
process.env.LOYALTY_DOLLARS_PER_POINT = '0.01';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.resetAllMocks();
});
