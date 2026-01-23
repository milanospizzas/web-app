import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkyTabClient, SkyTabApiError } from '../skytab.client';

// Mock the config
vi.mock('../../../../../config', () => ({
  config: {
    SHIFT4_ENVIRONMENT: 'sandbox',
    SKYTAB_API_KEY: 'test-api-key',
    SKYTAB_API_SECRET: 'test-api-secret',
    SHIFT4_API_KEY: 'test-shift4-key',
    SHIFT4_API_SECRET: 'test-shift4-secret',
  },
}));

// Mock the logger
vi.mock('../../../../../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SkyTabClient', () => {
  let client: SkyTabClient;

  beforeEach(() => {
    client = new SkyTabClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should set sandbox URL by default', () => {
      expect(client.getBaseUrl()).toBe('https://conecto-api-sandbox.shift4payments.com');
    });
  });

  describe('getAccessToken', () => {
    it('should fetch and cache access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'test-token-123',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          }),
      });

      const token = await client.getAccessToken();

      expect(token).toBe('test-token-123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rest/v1/credentials/accesstoken'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            InterfaceVersion: '4.0',
            InterfaceName: 'MilanosPizza',
          }),
        })
      );
    });

    it('should return cached token if still valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'test-token-123',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          }),
      });

      // First call
      await client.getAccessToken();
      // Second call - should use cache
      const token = await client.getAccessToken();

      expect(token).toBe('test-token-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid credentials'),
      });

      await expect(client.getAccessToken()).rejects.toThrow('SkyTab authentication failed');
    });
  });

  describe('request', () => {
    beforeEach(() => {
      // Setup successful auth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'test-token-123',
              expiresIn: 3600,
            },
          }),
      });
    });

    it('should make authenticated request successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { data: 'test' } }),
      });

      const result = await client.get<{ result: { data: string } }>('/api/test');

      expect(result.result.data).toBe('test');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            AccessToken: 'test-token-123',
          }),
        })
      );
    });

    it('should retry on 5xx errors', async () => {
      // First attempt - 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
      });

      // Second attempt - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { data: 'test' } }),
      });

      const result = await client.get<{ result: { data: string } }>('/api/test', {
        retryDelay: 10, // Short delay for tests
      });

      expect(result.result.data).toBe('test');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Auth + 2 requests
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 'INVALID_REQUEST', message: 'Bad request' },
          }),
      });

      await expect(client.get('/api/test')).rejects.toThrow('Bad request');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Auth + 1 request
    });

    it('should retry on rate limit (429)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '1' }),
          json: () =>
            Promise.resolve({
              error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: { data: 'test' } }),
        });

      const result = await client.get<{ result: { data: string } }>('/api/test', {
        retryDelay: 10,
      });

      expect(result.result.data).toBe('test');
    });

    it('should throw SkyTabApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' },
          }),
      });

      try {
        await client.get('/api/test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SkyTabApiError);
        expect((error as SkyTabApiError).code).toBe('RESOURCE_NOT_FOUND');
        expect((error as SkyTabApiError).statusCode).toBe(404);
      }
    });
  });

  describe('HTTP method helpers', () => {
    beforeEach(() => {
      // Setup successful auth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'test-token-123',
              expiresIn: 3600,
            },
          }),
      });
    });

    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { created: true } }),
      });

      const body = { name: 'Test' };
      await client.post('/api/test', body);

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should make PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { updated: true } }),
      });

      await client.put('/api/test', { data: 'test' });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { deleted: true } }),
      });

      await client.delete('/api/test');

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'test-token',
              expiresIn: 3600,
            },
          }),
      });

      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('clearToken', () => {
    it('should clear cached token', async () => {
      // First, get a token to cache it
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'old-token',
              expiresIn: 3600,
            },
          }),
      });

      await client.getAccessToken();

      // Clear the token
      client.clearToken();

      // Next call should fetch a new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              accessToken: 'new-token',
              expiresIn: 3600,
            },
          }),
      });

      const token = await client.getAccessToken();

      expect(token).toBe('new-token');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('SkyTabApiError', () => {
  it('should create error with all properties', () => {
    const error = new SkyTabApiError('Test error', 'TEST_CODE', 500, { detail: 'test' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ detail: 'test' });
    expect(error.name).toBe('SkyTabApiError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new SkyTabApiError('Test error', 'TEST_CODE', 404);
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'SkyTabApiError',
      message: 'Test error',
      code: 'TEST_CODE',
      statusCode: 404,
      details: undefined,
    });
  });
});
