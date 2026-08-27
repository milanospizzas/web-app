BEGIN;

-- Serialize the duplicate check, backfill, and unique-index creation. A reviewed
-- maintenance window is required before this migration is applied to an existing database.
LOCK TABLE "payment_transactions" IN ACCESS EXCLUSIVE MODE;

-- Refuse to guess which payment attempt is authoritative when legacy data has
-- more than one active or successful sale for an order.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "payment_transactions"
        WHERE "transactionType" = 'sale'
          AND "status" IN (
              'pending',
              'processing',
              'reconciliation_required',
              'authorized',
              'completed'
          )
        GROUP BY "orderId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Payment persistence migration blocked: at least one order has multiple active or successful sale transactions. Manual payment review is required; no payment record was selected or changed.';
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "activeSaleOrderId" TEXT,
ADD COLUMN     "failureCode" TEXT,
ADD COLUMN     "failureKind" TEXT,
ADD COLUMN     "idempotencyKeyHash" TEXT,
ADD COLUMN     "lastReconciledAt" TIMESTAMP(3),
ADD COLUMN     "providerRequestStartedAt" TIMESTAMP(3),
ADD COLUMN     "providerResponseReceivedAt" TIMESTAMP(3),
ADD COLUMN     "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requestFingerprint" TEXT,
ADD COLUMN     "resolutionSource" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- Conservatively reserve the order concurrency key for each unambiguous legacy
-- sale that is active, uncertain, authorized, or completed.
UPDATE "payment_transactions"
SET "activeSaleOrderId" = "orderId"
WHERE "activeSaleOrderId" IS NULL
  AND "transactionType" = 'sale'
  AND "status" IN (
      'pending',
      'processing',
      'reconciliation_required',
      'authorized',
      'completed'
  );

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_hash_key" ON "payment_transactions"("idempotencyKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_active_sale_order_id_key" ON "payment_transactions"("activeSaleOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_order_type_status_idx" ON "payment_transactions"("orderId", "transactionType", "status");

-- CreateIndex
CREATE INDEX "payment_transactions_status_last_reconciled_at_idx" ON "payment_transactions"("status", "lastReconciledAt");

COMMIT;
