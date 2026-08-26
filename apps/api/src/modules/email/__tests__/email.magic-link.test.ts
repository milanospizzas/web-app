import type { SendEmailCommandOutput } from '@aws-sdk/client-ses';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('EmailService.sendMagicLink', () => {
  const originalExpiry = process.env.MAGIC_LINK_EXPIRY_MINUTES;

  afterEach(() => {
    if (originalExpiry === undefined) {
      delete process.env.MAGIC_LINK_EXPIRY_MINUTES;
    } else {
      process.env.MAGIC_LINK_EXPIRY_MINUTES = originalExpiry;
    }
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('uses the configured plural expiry in both email bodies', async () => {
    process.env.MAGIC_LINK_EXPIRY_MINUTES = '30';
    vi.resetModules();
    const { EmailService } = await import('../email.service');
    const sendResult: SendEmailCommandOutput = {
      $metadata: {},
      MessageId: 'synthetic-message-id',
    };
    const sendEmailSpy = vi
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue(sendResult);
    const service = new EmailService();

    await service.sendMagicLink(
      'recipient@example.test',
      'synthetic-magic-link-value',
      'https://example.test/continue'
    );

    expect(sendEmailSpy).toHaveBeenCalledOnce();
    const params = sendEmailSpy.mock.calls[0]?.[0];
    expect(params?.htmlBody).toContain('30 minutes');
    expect(params?.textBody).toContain('30 minutes');
    expect(params?.htmlBody).not.toContain('15 minutes');
    expect(params?.textBody).not.toContain('15 minutes');
    expect(params?.htmlBody).toContain(
      'http://localhost:3000/auth/verify?token=synthetic-magic-link-value'
    );
    expect(params?.textBody).toContain(
      'http://localhost:3000/auth/verify?token=synthetic-magic-link-value'
    );
  });

  it('uses singular grammar for a one-minute expiry', async () => {
    process.env.MAGIC_LINK_EXPIRY_MINUTES = '1';
    vi.resetModules();
    const { EmailService } = await import('../email.service');
    const sendResult: SendEmailCommandOutput = {
      $metadata: {},
      MessageId: 'synthetic-message-id',
    };
    const sendEmailSpy = vi
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue(sendResult);
    const service = new EmailService();

    await service.sendMagicLink('recipient@example.test', 'synthetic-magic-link-value');

    expect(sendEmailSpy).toHaveBeenCalledOnce();
    const params = sendEmailSpy.mock.calls[0]?.[0];
    expect(params?.htmlBody).toContain('1 minute');
    expect(params?.textBody).toContain('1 minute');
    expect(params?.htmlBody).not.toContain('1 minutes');
    expect(params?.textBody).not.toContain('1 minutes');
  });
});
