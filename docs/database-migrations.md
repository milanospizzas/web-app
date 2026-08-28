# Database migrations

This repository uses committed Prisma migrations as the only deployable database
history. The first history is:

1. `20260827000000_baseline` — the schema at main commit
   `7b6f32c9b4420a9d6de003f7033bd94cb8b45ea9`.
2. `20260827010000_payment_attempt_foundation` — additive payment-attempt
   persistence fields, indexes, the legacy active-sale backfill, and its duplicate
   guard.

The repository currently has no `packageManager` pin. The commands below use the
verified pnpm 9 toolchain through Corepack and never use `prisma db push`.

## Safety rules

- Never mark the baseline migration as applied until the target schema has been
  proven equivalent to the baseline schema.
- Never use `prisma db push` in production.
- Never auto-delete, rewrite, or choose a winner among duplicate payment records.
- Never apply the existing-database procedure to production without an approved,
  reviewed change window, a verified backup, and an application maintenance plan.
- Use a process-scoped `DATABASE_URL`; do not put credentials in the repository,
  shell history, command arguments, or documentation.
- Stop on any unexpected schema difference or ambiguous payment state.
- This change does not migrate, inspect, or connect to any real database.

## A. Fresh database procedure

Use this only for a new, empty PostgreSQL database.

1. Install the exact locked dependency graph and generate Prisma Client:

   ```powershell
   corepack pnpm@9.15.9 install --frozen-lockfile
   if ($LASTEXITCODE -ne 0) { throw "dependency install failed with exit code $LASTEXITCODE" }

   corepack pnpm@9.15.9 --filter @milanos/api db:generate
   if ($LASTEXITCODE -ne 0) { throw "Prisma generation failed with exit code $LASTEXITCODE" }
   ```

2. Supply the new database URL through the approved secret manager, set it only in
   the current process, and run deployment and verification inside a fail-fast
   block:

   ```powershell
   if ([string]::IsNullOrWhiteSpace($FreshDatabaseUrl)) {
     throw "retrieve the fresh database URL through the approved secret manager"
   }

   $env:DATABASE_URL = $FreshDatabaseUrl

   try {
     corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate deploy --schema prisma/schema.prisma
     if ($LASTEXITCODE -ne 0) { throw "migrate deploy failed with exit code $LASTEXITCODE" }

     corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate status --schema prisma/schema.prisma
     if ($LASTEXITCODE -ne 0) { throw "migrate status failed with exit code $LASTEXITCODE" }

     corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
     if ($LASTEXITCODE -ne 0) { throw "schema comparison failed with exit code $LASTEXITCODE" }
   }
   finally {
     Remove-Item -LiteralPath Env:DATABASE_URL -ErrorAction SilentlyContinue
     $FreshDatabaseUrl = $null
   }
   ```

3. Require `migrate status` to report both migrations as applied with no pending
   or failed migration. Require the final comparison to exit `0` with no diff.
   Exit code `2` from `migrate diff` means a schema difference exists; investigate
   it rather than accepting it. `--from-schema-datasource` reads the URL from the
   process environment so the credential is not copied into a command argument.

## B. Existing Prisma migration-history preflight

Run this read-only preflight against every existing target before baselining it.
Use the approved database client with the database URL held only in the current
process, and confirm that `current_schema()` is the schema targeted by the Prisma
datasource.

First determine whether the Prisma history table exists:

```sql
SELECT
    current_database() AS "databaseName",
    current_schema() AS "targetSchema",
    to_regclass(
        format('%I.%I', current_schema(), '_prisma_migrations')
    ) IS NOT NULL AS "migrationHistoryTableExists";
```

When the table exists, list every history record; an empty result must be recorded
as an empty history rather than treated as if the check was skipped:

```sql
SELECT
    id,
    migration_name,
    started_at,
    finished_at,
    rolled_back_at,
    applied_steps_count,
    CASE
        WHEN logs IS NULL THEN 'null'
        ELSE 'non-null'
    END AS "logsState"
FROM "_prisma_migrations"
ORDER BY started_at, id;
```

- If `_prisma_migrations` is absent, proceed only after the baseline schema
  equivalence check in section C succeeds.
- If it exists but is empty, record that fact and proceed only after the same
  schema equivalence check succeeds.
- If it contains any row, stop until every entry and its completion or rollback
  state has been explicitly reviewed and reconciled. Never put the new baseline
  on top of unexplained migration history.
- Never manually delete, insert, or rewrite `_prisma_migrations` rows.

## C. Existing database baselining procedure

This is a reviewed rollout procedure, not an instruction to run immediately. It
must first be rehearsed against a disposable copy containing no real customer or
merchant data. Complete the migration-history preflight in section B before this
procedure. This PR performs no baselining of any existing database.

### 1. Back up and enter maintenance

1. Take a database backup using the platform-approved mechanism.
2. Verify that the backup is readable and restorable.
3. Put ordering and payment operations into an approved maintenance state. The
   migration takes an `ACCESS EXCLUSIVE` lock on `payment_transactions` so its
   duplicate check, backfill, and unique-index creation cannot race with writes.

### 2. Prove equivalence to the baseline

The baseline is the exact schema from commit
`7b6f32c9b4420a9d6de003f7033bd94cb8b45ea9`, before the payment-foundation
fields were added. Materialize that tracked file into an approved temporary
directory outside the repository, then compare the existing database to it:

```powershell
$BaselineSchemaName = 'milanos-baseline-schema-' + [guid]::NewGuid().ToString('N') + '.prisma'
$BaselineSchema = Join-Path $ApprovedTemporaryDirectory $BaselineSchemaName
if (Test-Path -LiteralPath $BaselineSchema) { throw "temporary baseline path already exists" }
if ([string]::IsNullOrWhiteSpace($ExistingDatabaseUrl)) {
  throw "retrieve the existing database URL through the approved secret manager"
}

$env:DATABASE_URL = $ExistingDatabaseUrl
try {
  $BaselineSchemaText = git show 7b6f32c9b4420a9d6de003f7033bd94cb8b45ea9:apps/api/prisma/schema.prisma
  if ($LASTEXITCODE -ne 0) { throw "could not materialize the baseline schema" }
  $BaselineSchemaText | Set-Content -LiteralPath $BaselineSchema -Encoding utf8 -ErrorAction Stop

  corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel $BaselineSchema --exit-code
  if ($LASTEXITCODE -ne 0) { throw "baseline comparison failed with exit code $LASTEXITCODE" }
}
finally {
  Remove-Item -LiteralPath Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $BaselineSchema -Force -ErrorAction SilentlyContinue
  $BaselineSchemaText = $null
  $ExistingDatabaseUrl = $null
}
```

Require exit code `0` with no diff. Stop when any unexplained drift exists. Do not
mark the baseline applied merely because the application has previously worked
against the database.

### 3. Run the payment preflight

Run the following read-only query using the approved database client:

```sql
SELECT
    "orderId",
    COUNT(*) AS "activeSaleCount",
    ARRAY_AGG("id" ORDER BY "createdAt", "id") AS "transactionIds"
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
ORDER BY "orderId";
```

The expected result is zero rows. If any row is returned, stop and require manual
payment review. Do not automatically select a transaction, delete a row, or change
a payment to failed, voided, or refunded.

Separately review every pending, processing, reconciliation-required, authorized,
or otherwise ambiguous payment row under the approved payment-operations process.

The payment-foundation migration deliberately uses one top-level PostgreSQL `DO`
statement. Its `ACCESS EXCLUSIVE` lock, duplicate guard, eleven column additions,
backfill, and four index creations therefore remain one atomic unit. The earlier
explicit `BEGIN`/`COMMIT` form failed its Prisma 5.22 deployment test: the guard
exception left the transaction aborted, Prisma surfaced PostgreSQL `25P02`, and
the failed `_prisma_migrations.logs` value was null. The single-statement form
lets PostgreSQL roll back the statement while returning the original guard error
for Prisma to record.

### 4. Record the baseline and deploy the additive migration

Only after backup verification, maintenance entry, zero unexplained drift, a clean
duplicate preflight, and payment review may the baseline be recorded as already
applied. Reacquire `$ExistingDatabaseUrl` through the approved secret-manager
workflow for this separate guarded block; never rely on a repository `.env` file:

```powershell
if ([string]::IsNullOrWhiteSpace($ExistingDatabaseUrl)) {
  throw "reacquire the existing database URL through the approved secret manager"
}

$env:DATABASE_URL = $ExistingDatabaseUrl
try {
  corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate resolve --applied 20260827000000_baseline --schema prisma/schema.prisma
  if ($LASTEXITCODE -ne 0) { throw "migrate resolve failed with exit code $LASTEXITCODE" }

  corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate deploy --schema prisma/schema.prisma
  if ($LASTEXITCODE -ne 0) { throw "migrate deploy failed with exit code $LASTEXITCODE" }

  corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate status --schema prisma/schema.prisma
  if ($LASTEXITCODE -ne 0) { throw "migrate status failed with exit code $LASTEXITCODE" }

  corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
  if ($LASTEXITCODE -ne 0) { throw "schema comparison failed with exit code $LASTEXITCODE" }
}
finally {
  Remove-Item -LiteralPath Env:DATABASE_URL -ErrorAction SilentlyContinue
  $ExistingDatabaseUrl = $null
}
```

Mark only `20260827000000_baseline` as already applied. Do not mark the payment
foundation migration as applied manually.

If deployment returns the exact duplicate/manual-review guard, keep maintenance
active and follow section 5. For any other failure, stop and investigate. Never
simply retry a failed migration.

### 5. Recovering from a duplicate-guard migration failure

If `migrate deploy` fails at the duplicate guard, keep ordering and payment
traffic in maintenance. Do not retry or resolve the migration blindly.

1. Run `prisma migrate status` and record its result. A nonzero result caused by
   the failed migration is diagnostic evidence, not permission to continue:

   ```powershell
   corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate status --schema prisma/schema.prisma
   ```

2. Through the approved database client, inspect every history row for the
   foundation migration, including its stored logs:

   ```sql
   SELECT
       migration_name,
       started_at,
       finished_at,
       rolled_back_at,
       applied_steps_count,
       logs
   FROM "_prisma_migrations"
   WHERE migration_name = '20260827010000_payment_attempt_foundation'
   ORDER BY started_at, id;
   ```

   Require an unfinished, not-yet-rolled-back record with non-null logs containing
   the stable `Payment persistence migration blocked` and `Manual payment review
   is required` message. If the failure, lifecycle state, or logs differ, stop and
   investigate; do not mark the migration applied or rolled back. Review stored
   logs only through approved secure access; do not copy them into an insecure
   ticket or general-purpose log.

3. Prove that the failed `DO` statement rolled back before changing data or
   migration history. Confirm all conflicting payment rows and every original
   value remain, none of the eleven additive columns exists, none of the four
   named indexes exists, and no partial backfill occurred. Do not run
   `migrate resolve` until every rollback check passes.

   The following checks must each return zero rows:

   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_schema = current_schema()
     AND table_name = 'payment_transactions'
     AND column_name IN (
         'activeSaleOrderId',
         'failureCode',
         'failureKind',
         'idempotencyKeyHash',
         'lastReconciledAt',
         'providerRequestStartedAt',
         'providerResponseReceivedAt',
         'reconciliationAttempts',
         'requestFingerprint',
         'resolutionSource',
         'resolvedAt'
     )
   ORDER BY column_name;

   SELECT indexname
   FROM pg_indexes
   WHERE schemaname = current_schema()
     AND tablename = 'payment_transactions'
     AND indexname IN (
         'payment_transactions_idempotency_key_hash_key',
         'payment_transactions_active_sale_order_id_key',
         'payment_transactions_order_type_status_idx',
         'payment_transactions_status_last_reconciled_at_idx'
     )
   ORDER BY indexname;
   ```

   Also require the baseline history record to remain successfully finished.

4. Review the conflicting payments manually under the approved payment-operations
   process. Never automatically choose a winner or automatically delete, refund,
   void, fail, or complete a payment. Apply only the separately approved data
   correction, record that decision, retain the payment evidence, and rerun the
   duplicate preflight; require zero conflicts.

5. Reacquire the database URL through the approved secret-manager workflow, keep
   it process-scoped, and mark the failed attempt rolled back:

   ```powershell
   if ([string]::IsNullOrWhiteSpace($ExistingDatabaseUrl)) {
     throw "reacquire the existing database URL through the approved secret manager"
   }

   $env:DATABASE_URL = $ExistingDatabaseUrl
   try {
     corepack pnpm@9.15.9 --filter @milanos/api exec prisma migrate resolve --rolled-back 20260827010000_payment_attempt_foundation --schema prisma/schema.prisma
     if ($LASTEXITCODE -ne 0) { throw "migrate resolve --rolled-back failed with exit code $LASTEXITCODE" }
   }
   finally {
     Remove-Item -LiteralPath Env:DATABASE_URL -ErrorAction SilentlyContinue
     $ExistingDatabaseUrl = $null
   }
   ```

   Never use `--applied` for this failed foundation migration. Inspect all its
   history rows again and require the failed record to be marked rolled back while
   retaining its logs; never manually edit or delete a history row.

6. Reacquire the URL for a new guarded block, rerun `prisma migrate deploy`, then
   repeat migration status, payment data-preservation, constraint, backfill, and
   datasource-based drift checks. The expected Prisma 5.22 history is the retained
   failed-and-rolled-back attempt plus a separate successful application; inspect
   the authoritative rows rather than assuming one row per migration name.

Never restore ordering or payment traffic until deployment and every verification
complete successfully.

### 6. Verify before restoring traffic

Verify all of the following before leaving maintenance:

- `_prisma_migrations` has no unfinished, unresolved record. A normal deployment
  records the baseline and foundation successfully; a recovered deployment also
  retains the logged, rolled-back failed attempt and records a separate successful
  foundation application.
- All eleven additive columns exist on `payment_transactions`.
- `reconciliationAttempts` is non-null with default `0`.
- `payment_transactions_idempotency_key_hash_key` enforces uniqueness for
  non-null `idempotencyKeyHash` values.
- `payment_transactions_active_sale_order_id_key` enforces uniqueness for
  non-null `activeSaleOrderId` values.
- `payment_transactions_order_type_status_idx` and
  `payment_transactions_status_last_reconciled_at_idx` exist.
- Each pre-existing active or successful sale has `activeSaleOrderId = orderId`.
- Failed, declined, and voided sales, refund transactions, and unrelated
  transaction types retain a null `activeSaleOrderId`.
- Payment amounts, statuses, provider identifiers, legacy sensitive columns, and
  all other payment data are unchanged.
- The deployed database has zero diff from `apps/api/prisma/schema.prisma` using
  the same datasource-based `prisma migrate diff --exit-code` command as the fresh
  procedure.
- The current application has passed compatibility checks against the additive
  schema.

Re-enable ordering and payment traffic only after all checks pass. The guarded
command blocks clear process-scoped database variables and temporary schema files
on both success and failure.

## D. Rollback boundary

The current application does not read or write the new fields, so an application
rollback does not require immediately dropping the additive columns or indexes.
The safest routine rollback is to roll back the application while retaining the
additive database objects.

- Do not delete payment records during rollback.
- Do not clear or rewrite payment status, amount, provider, or legacy data.
- Do not run `prisma db push` to force the schema backward.
- Any database rollback must be a separately reviewed SQL change with its own
  data-preservation, locking, and recovery plan.
- Retaining the additive columns preserves payment evidence and remains compatible
  with the current application.
