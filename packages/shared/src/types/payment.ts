import type { PaymentTransactionType, PaymentStatus } from '../constants';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  transactionType: PaymentTransactionType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  cardLast4?: string;
  cardBrand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  i4goToken: string;
  saveCard?: boolean;
}

export interface RefundPaymentRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface VoidPaymentRequest {
  transactionId: string;
  reason?: string;
}

export interface Shift4AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface Shift4SaleRequest {
  amount: {
    total: number;
  };
  card: {
    token: string;
  };
  invoice: string;
  clerk: {
    numericId: string;
  };
}

export interface Shift4SaleResponse {
  result: {
    transaction: {
      invoice: string;
      authCode: string;
      token: {
        value: string;
      };
      responseCode: string;
      responseText: string;
      avsResult?: string;
      cvvResult?: string;
    };
  };
}

export interface Shift4RefundRequest {
  amount: {
    total: number;
  };
  transaction: {
    invoice: string;
  };
  clerk: {
    numericId: string;
  };
}

export interface Shift4InvoiceInformationResponse {
  result: {
    transaction: {
      invoice: string;
      transactionType: string;
      responseCode: string;
      responseText: string;
      amount: {
        total: number;
      };
    };
  };
}
