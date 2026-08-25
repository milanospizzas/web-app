import { afterEach, describe, expect, it, vi } from 'vitest';

describe('magic-link expiry configuration', () => {
  const originalValue = process.env.MAGIC_LINK_EXPIRY_MINUTES;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.MAGIC_LINK_EXPIRY_MINUTES;
    } else {
      process.env.MAGIC_LINK_EXPIRY_MINUTES = originalValue;
    }
    vi.resetModules();
  });

  it('defaults to 15 minutes when the environment value is absent', async () => {
    delete process.env.MAGIC_LINK_EXPIRY_MINUTES;
    vi.resetModules();

    const { config } = await import('../../../config');

    expect(config.MAGIC_LINK_EXPIRY_MINUTES).toBe(15);
  });

  it.each(['0', '-1', 'NaN', '1.5'])('rejects the invalid value %s', async (value) => {
    process.env.MAGIC_LINK_EXPIRY_MINUTES = value;
    vi.resetModules();

    await expect(import('../../../config')).rejects.toThrow();
  });
});
