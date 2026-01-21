import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '../../config';
import { prisma } from '../../shared/database/prisma';
import { logger } from '../../shared/utils/logger';

const sesClient = new SESClient({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  templateName?: string;
}

export class EmailService {
  async sendEmail({ to, subject, htmlBody, textBody, templateName }: SendEmailParams) {
    try {
      const command = new SendEmailCommand({
        Source: `${config.SES_FROM_NAME} <${config.SES_FROM_EMAIL}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: textBody
              ? {
                  Data: textBody,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      });

      const result = await sesClient.send(command);

      // Log email
      await prisma.emailLog.create({
        data: {
          to,
          from: config.SES_FROM_EMAIL,
          subject,
          templateName,
          status: 'sent',
          provider: 'ses',
          providerId: result.MessageId,
          sentAt: new Date(),
        },
      });

      logger.info({ to, subject, messageId: result.MessageId }, 'Email sent successfully');
      return result;
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');

      // Log failed email
      await prisma.emailLog.create({
        data: {
          to,
          from: config.SES_FROM_EMAIL,
          subject,
          templateName,
          status: 'failed',
          provider: 'ses',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async sendMagicLink(email: string, token: string, redirectUrl?: string) {
    const magicLink = `${config.FRONTEND_URL}/auth/verify?token=${token}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">Welcome to Milano's Pizza!</h2>
            <p>Click the button below to sign in to your account:</p>
            <div style="margin: 30px 0;">
              <a href="${magicLink}"
                 style="display: inline-block; padding: 12px 30px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Sign In
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #d32f2f;">${magicLink}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 15 minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this email, you can safely ignore it.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Milano's Pizza. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
      Welcome to Milano's Pizza!

      Click this link to sign in to your account:
      ${magicLink}

      This link will expire in 15 minutes.

      If you didn't request this email, you can safely ignore it.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Sign in to Milano\'s Pizza',
      htmlBody,
      textBody,
      templateName: 'magic_link',
    });
  }

  async sendOrderConfirmation(order: any) {
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">Order Confirmation</h2>
            <p>Thank you for your order!</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Order Type:</strong> ${order.orderType}</p>
              <p style="margin: 5px 0;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            </div>
            <p>We'll send you another email when your order is ready.</p>
            <div style="margin: 30px 0;">
              <a href="${config.FRONTEND_URL}/account/orders/${order.id}"
                 style="display: inline-block; padding: 12px 30px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Order
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Milano's Pizza. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmation - #${order.orderNumber}`,
      htmlBody,
      templateName: 'order_confirmation',
    });
  }

  async sendOrderStatusUpdate(order: any, newStatus: string) {
    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed!',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready for pickup!',
      'out-for-delivery': 'Your order is out for delivery!',
      completed: 'Your order has been completed.',
    };

    const message = statusMessages[newStatus] || 'Your order status has been updated.';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d32f2f;">Order Update</h2>
            <p>${message}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${newStatus}</p>
            </div>
            <div style="margin: 30px 0;">
              <a href="${config.FRONTEND_URL}/account/orders/${order.id}"
                 style="display: inline-block; padding: 12px 30px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Order
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Milano's Pizza. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: order.customerEmail,
      subject: `Order Update - #${order.orderNumber}`,
      htmlBody,
      templateName: 'order_status_update',
    });
  }
}

export const emailService = new EmailService();
