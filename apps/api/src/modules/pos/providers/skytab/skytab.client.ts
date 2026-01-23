import { config } from '../../../../config';
import { logger } from '../../../../shared/utils/logger';
import type {
  SkyTabAccessTokenResponse,
  SkyTabErrorResponse,
  SkyTabRequestOptions,
} from '@milanos/shared';

// Rate limiting configuration
const RATE_LIMIT_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Default request options
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

interface RequestQueueItem {
  timestamp: number;
}

/**
 * SkyTab HTTP Client
 * Handles authentication, retry logic, and rate limiting for SkyTab Conecto API
 */
export class SkyTabClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private requestQueue: RequestQueueItem[] = [];

  constructor() {
    this.baseUrl =
      config.SHIFT4_ENVIRONMENT === 'production'
        ? 'https://conecto-api.shift4payments.com'
        : 'https://conecto-api-sandbox.shift4payments.com';
  }

  /**
   * Get or refresh access token
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry) {
      const bufferMs = 5 * 60 * 1000;
      if (new Date(Date.now() + bufferMs) < this.tokenExpiry) {
        return this.accessToken;
      }
    }

    const apiKey = config.SKYTAB_API_KEY || config.SHIFT4_API_KEY;
    const apiSecret = config.SKYTAB_API_SECRET || config.SHIFT4_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('SkyTab API credentials not configured');
    }

    try {
      logger.debug('Refreshing SkyTab access token');

      const response = await fetch(`${this.baseUrl}/api/rest/v1/credentials/accesstoken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
        },
        body: JSON.stringify({
          credential: {
            apiKey,
            apiSecret,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, error: errorText }, 'SkyTab authentication failed');
        throw new Error(`SkyTab authentication failed: ${response.statusText}`);
      }

      const data = (await response.json()) as { result: SkyTabAccessTokenResponse['result'] };
      this.accessToken = data.result.accessToken;
      this.tokenExpiry = new Date(Date.now() + data.result.expiresIn * 1000);

      logger.info('SkyTab access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error({ error }, 'Failed to get SkyTab access token');
      throw error;
    }
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean up old requests outside the window
    this.requestQueue = this.requestQueue.filter(
      (item) => now - item.timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Check if we've exceeded the rate limit
    if (this.requestQueue.length >= RATE_LIMIT_REQUESTS_PER_MINUTE) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = RATE_LIMIT_WINDOW_MS - (now - oldestRequest.timestamp);

      if (waitTime > 0) {
        logger.warn({ waitTime }, 'Rate limit reached, waiting before next request');
        await this.sleep(waitTime);
      }
    }

    // Add current request to queue
    this.requestQueue.push({ timestamp: Date.now() });
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(attempt: number, baseDelay: number): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(status: number, error?: unknown): boolean {
    // Retry on network errors, 5xx errors, and rate limiting
    if (status >= 500 || status === 429) {
      return true;
    }

    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    return false;
  }

  /**
   * Make authenticated request with retry logic
   */
  async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: SkyTabRequestOptions
  ): Promise<T> {
    const timeout = options?.timeout || DEFAULT_TIMEOUT_MS;
    const maxRetries = options?.retries ?? DEFAULT_RETRIES;
    const baseRetryDelay = options?.retryDelay || DEFAULT_RETRY_DELAY_MS;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limiting
        await this.checkRateLimit();

        // Get fresh token
        const token = await this.getAccessToken();

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const url = `${this.baseUrl}${endpoint}`;

          logger.debug(
            { method, endpoint, attempt: attempt + 1, maxRetries: maxRetries + 1 },
            'Making SkyTab API request'
          );

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              InterfaceVersion: '4.0',
              InterfaceName: 'MilanosPizza',
              AccessToken: token,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Parse response
          const responseData = await response.json();

          if (!response.ok) {
            const errorData = responseData as SkyTabErrorResponse;

            // Check if retryable
            if (this.isRetryableError(response.status) && attempt < maxRetries) {
              const delay = this.getBackoffDelay(attempt, baseRetryDelay);
              logger.warn(
                {
                  status: response.status,
                  error: errorData.error?.message,
                  retryIn: delay,
                  attempt: attempt + 1,
                },
                'SkyTab request failed, retrying'
              );
              await this.sleep(delay);
              continue;
            }

            // If rate limited, get retry-after header
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              if (retryAfter && attempt < maxRetries) {
                const delay = parseInt(retryAfter, 10) * 1000 || this.getBackoffDelay(attempt, baseRetryDelay);
                logger.warn({ retryAfter: delay }, 'Rate limited by SkyTab, waiting');
                await this.sleep(delay);
                continue;
              }
            }

            throw new SkyTabApiError(
              errorData.error?.message || `Request failed with status ${response.status}`,
              errorData.error?.code || 'UNKNOWN_ERROR',
              response.status,
              errorData.error?.details
            );
          }

          logger.debug(
            { method, endpoint, status: response.status },
            'SkyTab API request successful'
          );

          return responseData as T;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new SkyTabApiError(
            `Request timeout after ${timeout}ms`,
            'TIMEOUT',
            408
          );
        }

        // Check if should retry
        const isNetworkError = error instanceof TypeError;
        if (isNetworkError && attempt < maxRetries) {
          const delay = this.getBackoffDelay(attempt, baseRetryDelay);
          logger.warn(
            { error: lastError.message, retryIn: delay, attempt: attempt + 1 },
            'Network error, retrying SkyTab request'
          );
          await this.sleep(delay);
          continue;
        }

        // Don't retry non-retryable errors
        if (error instanceof SkyTabApiError && !this.isRetryableError(error.statusCode)) {
          throw error;
        }
      }
    }

    // All retries exhausted
    logger.error(
      { error: lastError?.message, method, endpoint },
      'SkyTab request failed after all retries'
    );
    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, options?: SkyTabRequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, body?: unknown, options?: SkyTabRequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, body?: unknown, options?: SkyTabRequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string, options?: SkyTabRequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get base URL (useful for debugging)
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Clear cached token (useful for testing or after errors)
   */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}

/**
 * Custom error class for SkyTab API errors
 */
export class SkyTabApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'SkyTabApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SkyTabApiError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Export singleton instance
export const skyTabClient = new SkyTabClient();
