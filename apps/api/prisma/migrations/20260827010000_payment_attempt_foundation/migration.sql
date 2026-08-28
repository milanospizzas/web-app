-- Keep the lock, duplicate guard, schema changes, backfill, and index creation in
-- one PostgreSQL statement. This preserves atomicity while allowing a guard
-- exception to reach Prisma without leaving an explicit transaction aborted.
DO $payment_attempt_foundation$
BEGIN
    -- Serialize the duplicate check, backfill, and unique-index creation. A reviewed
    -- maintenance window is required before this migration is applied to an existing database.
    EXECUTE $utility$
        LOCK TABLE "payment_transactions" IN ACCESS EXCLUSIVE MODE
    $utility$;

    -- Refuse to guess which payment attempt is authoritative when legacy data has
    -- more than one active or successful sale for an order.
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
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Payment persistence migration blocked: at least one order has multiple active or successful sale transactions. Manual payment review is required; no payment record was selected or changed.';
    END IF;

    -- AlterTable
    EXECUTE $utility$
        ALTER TABLE "payment_transactions"
            ADD COLUMN "activeSaleOrderId" TEXT,
            ADD COLUMN "failureCode" TEXT,
            ADD COLUMN "failureKind" TEXT,
            ADD COLUMN "idempotencyKeyHash" TEXT,
            ADD COLUMN "lastReconciledAt" TIMESTAMP(3),
            ADD COLUMN "providerRequestStartedAt" TIMESTAMP(3),
            ADD COLUMN "providerResponseReceivedAt" TIMESTAMP(3),
            ADD COLUMN "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN "requestFingerprint" TEXT,
            ADD COLUMN "resolutionSource" TEXT,
            ADD COLUMN "resolvedAt" TIMESTAMP(3)
    $utility$;

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
    EXECUTE $utility$
        CREATE UNIQUE INDEX "payment_transactions_idempotency_key_hash_key"
            ON "payment_transactions"("idempotencyKeyHash")
    $utility$;

    -- CreateIndex
    EXECUTE $utility$
        CREATE UNIQUE INDEX "payment_transactions_active_sale_order_id_key"
            ON "payment_transactions"("activeSaleOrderId")
    $utility$;

    -- CreateIndex
    EXECUTE $utility$
        CREATE INDEX "payment_transactions_order_type_status_idx"
            ON "payment_transactions"("orderId", "transactionType", "status")
    $utility$;

    -- CreateIndex
    EXECUTE $utility$
        CREATE INDEX "payment_transactions_status_last_reconciled_at_idx"
            ON "payment_transactions"("status", "lastReconciledAt")
    $utility$;
END;
$payment_attempt_foundation$;
