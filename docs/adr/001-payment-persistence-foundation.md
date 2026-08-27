# ADR 001: Payment persistence foundation

- Status: Accepted
- Date: 2026-08-27
- Scope: Database migration and persistence only

## Context

A payment request can be retried by a client, gateway, proxy, or operator. A
provider timeout can also leave the application unable to tell whether a charge
was accepted. Process-local checks cannot protect concurrent API instances, and a
provider invoice number alone does not bind repeated client requests to one
application-level payment attempt.

The repository previously had a Prisma schema but no committed migration history.
Before payment idempotency can be implemented safely, fresh databases need a
reproducible baseline and existing databases need a reviewed baselining procedure.

## Decision

### Database-enforced idempotency identity

`PaymentTransaction.idempotencyKeyHash` is nullable and uniquely indexed. The next
runtime change will hash a normalized idempotency key cryptographically and use the
hash as the lookup identity. Raw idempotency keys are sensitive bearer-like input
and will never be persisted.

`requestFingerprint` will bind that key to stable server-authoritative inputs such
as the order, authenticated owner, server-calculated amount, and currency. It must
never contain the i4Go token or any token-derived value. Reuse of one key for a
different fingerprint will be rejected by the future runtime.

Provider invoice numbers remain useful correlation identifiers for support and
provider reconciliation. They are not the only application idempotency control:
their creation and reuse occur too late to serialize all competing application
requests, and provider behavior cannot replace a database invariant owned by this
application.

### One active sale attempt per order

`activeSaleOrderId` is a nullable unique concurrency key, intentionally not a
foreign-key relation. The next runtime will populate it with `orderId` while a
sale is pending, processing, reconciliation-required, authorized, or completed.
Database uniqueness will then prevent two non-null active-sale claims for the same
order even when different application instances race.

Nullability is deliberate. PostgreSQL permits multiple null values in an ordinary
unique index, so refunds, unrelated transaction types, and definitive failed,
declined, or voided attempts do not contend on this key.

An ambiguous provider outcome retains the active-sale key. Releasing the key after
a timeout could permit a second charge while the first provider request may have
succeeded. A definitive failure may release the key only when the future runtime
has evidence that no successful charge remains possible. Authorized and completed
sales retain the key.

The migration backfills the key only for unambiguous legacy sale rows in the
active or successful states. If one order already has more than one such row, the
migration fails before changing any row and requires manual payment review; it
never chooses or deletes a transaction automatically.

### Provider lifecycle and resolution evidence

The following nullable timestamps and metadata support a later state machine and
reconciliation worker:

- `providerRequestStartedAt`
- `providerResponseReceivedAt`
- `resolvedAt`
- `lastReconciledAt`
- `reconciliationAttempts`, defaulting to zero
- `failureKind`
- `failureCode`
- `resolutionSource`

The status remains a string in this change. The documented future states are
`pending`, `processing`, `authorized`, `completed`, `declined`, `failed`,
`reconciliation_required`, `voided`, and `refunded`. No database enum is added and
no current runtime status value is changed.

### Legacy sensitive columns

`shift4Token` remains temporarily because removing or rewriting it requires a
separate data-retention and cleanup decision. The next runtime must never write a
new i4Go token into it. This migration does not read, null, rewrite, or delete any
existing value.

`rawResponse` also remains for compatibility. The next runtime must not store an
unredacted provider payload there. A later retention decision can address legacy
contents after appropriate review.

### Migration history

`20260827000000_baseline` is an empty-to-schema migration generated from the exact
Prisma schema at main commit `7b6f32c9b4420a9d6de003f7033bd94cb8b45ea9`.
`20260827010000_payment_attempt_foundation` is the additive migration described by
this ADR. Existing databases must first prove baseline equivalence and then mark
only the baseline migration as applied before deploying the second migration.

Every existing target must inspect `_prisma_migrations` before baselining. An
absent or empty history still requires exact baseline schema equivalence. Any
existing history row blocks baselining until every entry is explicitly reviewed
and reconciled; the new baseline must never be placed over unexplained history,
and migration-history rows must never be manually deleted or rewritten.

The original foundation SQL used a top-level explicit transaction. Its actual
Prisma 5.22 duplicate-deploy test showed that the guard exception aborted that
transaction, PostgreSQL `25P02` masked the custom exception, and the failed
`_prisma_migrations.logs` value was null. That was an operational auditability
defect, so the migration was corrected before merge or deployment.

The corrected migration is one top-level atomic PostgreSQL `DO` statement. The
`ACCESS EXCLUSIVE` lock, unchanged duplicate guard, eleven column additions,
backfill, and four indexes remain one atomic unit. No exception handler catches
the guard failure: PostgreSQL rolls back the statement without partial data or
schema changes, while Prisma can record the original custom error in the failed
migration history.

A duplicate failure is an intentional safety gate, not an automatically retried
condition. Recovery requires manual payment review, proof that the database
statement rolled back, a separately approved data correction, and then
`migrate resolve --rolled-back` followed by `migrate deploy`. Operations must not
automatically select or change a payment, use `--applied` for the failed
foundation migration, or restore traffic before every verification passes.

## Runtime boundary

This decision adds persistence capability only. It does not change a payment route,
call Shift4, change provider hosts or request bodies, process an i4Go token, add API
idempotency-key handling, reconcile provider state, or change any customer-facing
behavior.

The next payment-runtime change will:

1. Normalize and cryptographically hash the incoming idempotency key without
   storing its raw value.
2. Compute a request fingerprint from server-authoritative inputs without token
   material.
3. Claim `activeSaleOrderId` transactionally before starting a provider request.
4. Record provider-request and response timestamps.
5. Distinguish definitive failures from ambiguous outcomes.
6. Preserve the active-sale claim for ambiguous, authorized, and completed results.
7. Reconcile uncertain attempts and record reconciliation evidence.

That runtime work is intentionally outside this change.

## Consequences and known limitations

- Database uniqueness provides a cross-instance invariant, but the runtime does
  not use it yet.
- String statuses and failure fields remain application-defined; the database does
  not validate their vocabulary in this change.
- The migration takes an exclusive lock on `payment_transactions` and therefore
  needs a reviewed maintenance window on an existing database.
- Legacy token and raw-response values, if any, remain untouched.
- No reconciliation worker or provider status query exists yet.
- The future runtime must release `activeSaleOrderId` only for a truly definitive
  failure or void. Incorrect release logic could permit another sale attempt.
- Existing databases can contain unexplained drift or ambiguous payment data; the
  documented rollout stops instead of repairing either automatically.
- This change has been designed for PostgreSQL and relies on ordinary PostgreSQL
  unique-index null semantics.

## Rollback strategy

The current application ignores every new field. The routine rollback boundary is
therefore an application rollback that retains the additive columns and indexes.
Payment records must not be deleted or rewritten during rollback. Dropping database
objects is not part of routine rollback and would require a separate reviewed SQL
change with a backup, maintenance window, and data-preservation plan.
