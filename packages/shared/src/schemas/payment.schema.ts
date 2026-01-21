import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  i4goToken: z.string().min(1),
  saveCard: z.boolean().default(false),
});

export const refundPaymentSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const voidPaymentSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;
