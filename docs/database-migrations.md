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

## B. Existing database baselining procedure

This is a reviewed rollout procedure, not an instruction to run immediately. It
must first be rehearsed against a disposable copy containing no real customer or
merchant data. This PR performs no baselining of any existing database.

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

### 5. Verify before restoring traffic

Verify all of the following before leaving maintenance:

- `_prisma_migrations` records both migrations successfully.
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

## C. Rollback boundary

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
