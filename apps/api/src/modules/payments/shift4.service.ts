import { config } from '../../config';
import { prisma } from '../../shared/database/prisma';
import { logger } from '../../shared/utils/logger';
import { generateInvoiceNumber, redactSensitiveData } from '@milanos/shared';
import type {
  Shift4SaleRequest,
  Shift4SaleResponse,
  Shift4RefundRequest,
  Shift4AccessTokenResponse,
  Shift4InvoiceInformationResponse,
} from '@milanos/shared';

export class Shift4Service {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl =
      config.SHIFT4_ENVIRONMENT === 'production'
        ? 'https://api.shift4.com'
        : 'https://api.shift4test.com';
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/rest/v1/credentials/accesstoken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
        },
        body: JSON.stringify({
          credential: {
            apiKey: config.SHIFT4_API_KEY,
            apiSecret: config.SHIFT4_API_SECRET,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data: { result: Shift4AccessTokenResponse } = await response.json();
      this.accessToken = data.result.accessToken;
      this.tokenExpiry = new Date(Date.now() + data.result.expiresIn * 1000);

      logger.info('Shift4 access token obtained');
      return this.accessToken;
    } catch (error) {
      logger.error({ error }, 'Failed to get Shift4 access token');
      throw error;
    }
  }

  async processSale(
    orderId: string,
    amount: number,
    i4goToken: string
  ): Promise<{ transactionId: string; authCode: string }> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error('Order not found');
    }

    const invoiceNumber = generateInvoiceNumber();
    const accessToken = await this.getAccessToken();

    const requestBody: Shift4SaleRequest = {
      amount: {
        total: Math.round(amount * 100) / 100, // Ensure 2 decimal places
      },
      card: {
        token: i4goToken,
      },
      invoice: invoiceNumber,
      clerk: {
        numericId: config.SHIFT4_CLERK_ID,
      },
    };

    // Create payment transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId,
        transactionType: 'sale',
        status: 'pending',
        amount,
        currency: 'USD',
        shift4InvoiceNumber: invoiceNumber,
        shift4Token: i4goToken,
      },
    });

    // Log request
    await this.logTransaction(transaction.id, 'request_sent', requestBody);

    try {
      const response = await fetch(`${this.baseUrl}/api/rest/v1/transactions/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
          AccessToken: accessToken,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: Shift4SaleResponse = await response.json();

      // Log response
      await this.logTransaction(transaction.id, 'response_received', responseData, response.status);

      if (!response.ok || responseData.result?.transaction?.responseCode !== '0') {
        throw new Error(
          responseData.result?.transaction?.responseText || 'Payment processing failed'
        );
      }

      const txnData = responseData.result.transaction;

      // Update transaction with success
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          shift4TransactionId: txnData.invoice,
          shift4AuthCode: txnData.authCode,
          shift4ResponseCode: txnData.responseCode,
          shift4ResponseMessage: txnData.responseText,
          shift4AvsResult: txnData.avsResult,
          shift4CvvResult: txnData.cvvResult,
          rawResponse: responseData,
        },
      });

      logger.info({ orderId, transactionId: transaction.id }, 'Payment processed successfully');

      return {
        transactionId: transaction.id,
        authCode: txnData.authCode,
      };
    } catch (error) {
      logger.error({ error, orderId }, 'Payment processing failed');

      // Update transaction with failure
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Log error
      await this.logTransaction(
        transaction.id,
        'error',
        null,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refundTransactionId: string }> {
    const originalTransaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { order: true },
    });

    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    if (originalTransaction.status !== 'completed') {
      throw new Error('Can only refund completed transactions');
    }

    const refundAmount = amount || originalTransaction.amount.toNumber();
    const accessToken = await this.getAccessToken();

    const requestBody: Shift4RefundRequest = {
      amount: {
        total: Math.round(refundAmount * 100) / 100,
      },
      transaction: {
        invoice: originalTransaction.shift4InvoiceNumber!,
      },
      clerk: {
        numericId: config.SHIFT4_CLERK_ID,
      },
    };

    // Create refund transaction record
    const refundTransaction = await prisma.paymentTransaction.create({
      data: {
        orderId: originalTransaction.orderId,
        transactionType: 'refund',
        status: 'pending',
        amount: refundAmount,
        currency: 'USD',
        parentTransactionId: transactionId,
      },
    });

    // Log request
    await this.logTransaction(refundTransaction.id, 'request_sent', requestBody);

    try {
      const response = await fetch(`${this.baseUrl}/api/rest/v1/transactions/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
          AccessToken: accessToken,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      // Log response
      await this.logTransaction(
        refundTransaction.id,
        'response_received',
        responseData,
        response.status
      );

      if (!response.ok) {
        throw new Error(responseData.message || 'Refund processing failed');
      }

      // Update refund transaction
      await prisma.paymentTransaction.update({
        where: { id: refundTransaction.id },
        data: {
          status: 'completed',
          rawResponse: responseData,
        },
      });

      logger.info({ transactionId, refundTransactionId: refundTransaction.id }, 'Refund processed');

      return {
        refundTransactionId: refundTransaction.id,
      };
    } catch (error) {
      logger.error({ error, transactionId }, 'Refund processing failed');

      // Update refund transaction with failure
      await prisma.paymentTransaction.update({
        where: { id: refundTransaction.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async voidTransaction(transactionId: string, _reason?: string) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Can only void completed transactions');
    }

    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(`${this.baseUrl}/api/rest/v1/transactions/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
          AccessToken: accessToken,
        },
        body: JSON.stringify({
          transaction: {
            invoice: transaction.shift4InvoiceNumber,
          },
          clerk: {
            numericId: config.SHIFT4_CLERK_ID,
          },
        }),
      });

      const responseData = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(responseData.message || 'Void processing failed');
      }

      // Update transaction status
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'voided',
        },
      });

      logger.info({ transactionId }, 'Transaction voided');

      return { success: true };
    } catch (error) {
      logger.error({ error, transactionId }, 'Void processing failed');
      throw error;
    }
  }

  async getInvoiceInformation(invoiceNumber: string): Promise<Shift4InvoiceInformationResponse> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/api/rest/v1/transactions/invoice?invoice=${invoiceNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          InterfaceVersion: '4.0',
          InterfaceName: 'MilanosPizza',
          AccessToken: accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get invoice information');
    }

    return (await response.json()) as Shift4InvoiceInformationResponse;
  }

  private async logTransaction(
    transactionId: string,
    event: string,
    payload: any,
    httpStatusCode?: number,
    errorMessage?: string
  ) {
    const redactedPayload = payload ? redactSensitiveData(payload) : null;

    await prisma.transactionLog.create({
      data: {
        transactionId,
        event,
        requestPayload: event === 'request_sent' ? (redactedPayload ?? undefined) : undefined,
        responsePayload: event === 'response_received' ? (redactedPayload ?? undefined) : undefined,
        httpStatusCode: httpStatusCode || undefined,
        errorMessage,
      },
    });
  }
}

export const shift4Service = new Shift4Service();
