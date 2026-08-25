import { afterEach, describe, expect, it, vi } from 'vitest';

describe('magic-link expiry configuration', () => {
  const originalValue = process.env.MAGIC_LINK_EXPIRY_MINUTES;

  afterEach(() => {
    process.env.MAGIC_LINK_EXPIRY_MINUTES = originalValue;
    vi.resetModules();
  });

  it.each(['0', '-1', 'NaN', '1.5'])('rejects the invalid value %s', async (value) => {
    process.env.MAGIC_LINK_EXPIRY_MINUTES = value;
    vi.resetModules();

    await expect(import('../../../config')).rejects.toThrow();
  });
});
