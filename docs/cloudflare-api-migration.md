# Cloudflare API migration and Sevalla retirement

Status as of October 16, 2026: both Cloudflare API Workers are deployed, and staging passes the deployed smoke checks. PostgreSQL backup restoration has passed. Production smoke checks, Redis backup restoration, and Sevalla retirement are pending. This document does not record a completed deletion or cutover.

The owner authorized replacing the Milano API services on Sevalla and retiring the six listed services after verified backups and replacement checks. The live WordPress site, AWS Amplify, and DNS remain unchanged. The static frontend continues to use its existing [Cloudflare staging preview](cloudflare-static-staging.md).

## What is being replaced

The current public site reads its menu and content from the static export and hands ordering to SkyTab. It has no callers of the repository's dormant API client. The production API defaults its custom ordering, payment, and account flags to false; those flags were absent from the inspected deployment. Its intended public surface is `/health` with custom endpoints unavailable.

The older Sevalla development deployment registers legacy routes unconditionally, but its inspected database contains no application tables. Those unfinished routes are not promoted into the replacement. This migration preserves the current public site's behavior and keeps the future ordering platform disabled.

| Existing Sevalla service   | Role                               | Retirement status |
| -------------------------- | ---------------------------------- | ----------------- |
| `milanos-pizza-api-prod`   | Production API application         | Pending           |
| `milanos-pizza-api-dev`    | Legacy development API application | Pending           |
| `milanos-pizza-prod`       | Production PostgreSQL database     | Pending           |
| `milanos-pizza-dev`        | Development PostgreSQL database    | Pending           |
| `milanos-pizza-redis-prod` | Production Redis database          | Pending           |
| `milanos-pizza-redis-dev`  | Development Redis database         | Pending           |

Neither API application has a custom domain. There is no DNS cutover in this migration. Provider-owned Sevalla URLs cannot be transferred to Cloudflare; any discovered consumer of an old URL must be updated and verified before the corresponding service is retired.

## Cloudflare replacement contract

`wrangler.api.jsonc` selects the approved Cloudflare account and these two independent Workers:

- Default/staging: `milanos-pizza-api-staging`, at `https://milanos-pizza-api-staging.bautistajose95.workers.dev`.
- Production environment: `milanos-pizza-api`, at `https://milanos-pizza-api.bautistajose95.workers.dev`.

Both destinations have been deployed; their version IDs are recorded below. The configuration has no custom domains, routes, database bindings, Redis bindings, secrets, queues, scheduled jobs, or paid-service bindings.

The Worker has no imports and does not read environment variables, request bodies, cookies, or credentials. It makes no outbound requests and logs no request data. Its contract is:

- Exact `GET /health` returns JSON with `status: "ok"`, an ISO timestamp, `version: "1.0.0"`, and `mode: "dormant"`.
- Health reports both database and Redis as `not_required`, and custom ordering, custom payment, and accounts as false. It does not pretend to check connections to retired services.
- `HEAD /health` returns the same status and headers with no body.
- All other paths and methods return a Fastify-shaped JSON 404; HEAD responses have no body. Error messages include only a bounded pathname, never query parameters.
- All responses carry `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, and `X-Content-Type-Options: nosniff`.
- No CORS permissions or session cookies are issued. Environment flags cannot activate account, payment, POS, or database-backed routes.

No D1 database is needed for this dormant public contract. The existing Fastify/Prisma source and migrations remain in the repository for separately reviewed future work.

## Local checks and explicit deployment

Use Node.js 24 and pnpm 9.15.9 with the pinned Wrangler dependency:

```sh
pnpm install --frozen-lockfile
npm run test:cloudflare:api
npm run check:cloudflare:api
pnpm exec wrangler deploy --config wrangler.api.jsonc --env= --dry-run --strict
pnpm exec wrangler deploy --config wrangler.api.jsonc --env production --dry-run --strict
npm run preview:cloudflare:api
# In another terminal:
node apps/api/cloudflare/smoke.mjs http://127.0.0.1:8788
```

The unit suite verifies the disabled routes even with hostile environment flags and credentials, and rejects network, binding, and logging side effects. The smoke script performs 31 read-only GET/HEAD/OPTIONS requests. It accepts only loopback HTTP or the two exact API Worker HTTPS origins above, follows no redirects, and limits JSON response size. It sends no order, payment, email, or webhook POST request.

Before deployment, confirm the selected account, exact Worker names, reviewed source commit, and absence of unexpected existing bindings or secrets. Record any previous Cloudflare version IDs for rollback. An unexpected account, Worker, binding, or caller is a stop condition to resolve before continuing.

```sh
pnpm exec wrangler whoami
pnpm exec wrangler deploy --config wrangler.api.jsonc --env= --strict
node apps/api/cloudflare/smoke.mjs https://milanos-pizza-api-staging.bautistajose95.workers.dev
pnpm exec wrangler deployments list --config wrangler.api.jsonc --env=

pnpm exec wrangler deploy --config wrangler.api.jsonc --env production --strict
node apps/api/cloudflare/smoke.mjs https://milanos-pizza-api.bautistajose95.workers.dev
pnpm exec wrangler deployments list --config wrangler.api.jsonc --env production
```

The explicit `--env=` selects the top-level staging configuration; `--env production` selects production. Use the returned deployment metadata to verify each URL and version. A newly created hostname may take a short time to propagate: an initial 404 is not a passing smoke result, and retirement must wait for the successful complete check. Do not mount legacy database, session, Shift4, SkyTab, or email credentials into either Worker. Do not override the account, Worker names, domains, or routes on the command line.

`.github/workflows/cloudflare-api-check.yml` runs the unit suite, type checks, and local Worker smoke with read-only repository permissions. It has no deployment credentials or deployment step. The obsolete placeholder Sevalla deployment job has been removed from the manual deployment workflow; the Amplify job is unchanged. Provider integrations and main-branch merges remain separate operational actions.

## Backup evidence and retirement gate

Initial read-only inspection found no application objects in either actual PostgreSQL application database or its `postgres` maintenance database. Both Redis 8.2.2 instances reported an empty keyspace. Absence of application data does not substitute for backup verification.

Full encrypted PostgreSQL application-database dumps have been restored into isolated PostgreSQL 17 instances, and their application-object catalogs match the inspected empty source catalogs. Redis RDB backup and isolated restoration are pending at this document revision. Backup files, credentials, detailed inventory, and restore evidence stay in the owner's private backup location; they must not be added to Git, CI artifacts, public logs, or this runbook.

Before retiring any listed service, complete and record:

- PostgreSQL and Redis backup integrity checks and successful isolated restores, including matching source/restore inventories.
- An exact service inventory showing the resources belong to this application, with no WordPress dependency or unaccounted consumer.
- Successful deployed smoke checks for both Cloudflare API Workers and recorded source commit/version IDs.
- A fresh static frontend navigation check showing SkyTab ordering links and no requests to the retiring APIs.
- Any required caller updates, plus a final check that no custom domain or DNS record needs changing.
- Recovery instructions and private access to the preserved configuration and backups.

Retire only the six named Milano services after those checks pass. Retire the application processes before their database dependencies. Do not delete the Sevalla account, unrelated resources, repository branches/worktrees, WordPress, Amplify, or DNS records. Confirm service removal and the resulting provider inventory, then update the table and completion record below with verified results. Existing charges continue while resources remain active; provider billing may include usage accrued before retirement.

## Rollback

Before Sevalla retirement, rollback can retain the existing Sevalla services while the Cloudflare candidate is corrected. The static site and live WordPress site require no change because they do not call these Workers.

For an update to an existing Cloudflare API Worker, restore its previously recorded version with the explicit matching configuration/environment, then rerun the API smoke checks:

```sh
pnpm exec wrangler rollback PREVIOUS_STAGING_VERSION_ID --config wrangler.api.jsonc --env=
pnpm exec wrangler rollback PREVIOUS_PRODUCTION_VERSION_ID --config wrangler.api.jsonc --env production
```

Replace the placeholders with recorded version IDs; do not assume a previous version exists for an initial deployment.

After provider resources have been retired, recovering Sevalla is a restore operation, not an instant resume. Recreate only the required matching PostgreSQL/Redis services; recover the private backups into isolated instances of compatible versions, validate their catalogs/keyspace, and restore application configuration through secure secret handling. Rebuild the reviewed API version with custom ordering, payment, and accounts disabled. Verify health and unavailable routes before restoring any identified consumers. New provider URLs or credentials must be propagated only to those consumers; the old provider URLs may not be recoverable.

Do not seed, reset, or run Prisma migrations against restored data as an automatic rollback step. Never enable legacy development routes, send payment/POS/email requests, or change WordPress/DNS to make a rollback appear successful. Keep encrypted originals and restore evidence until the owner's retention decision.

## Future stateful platform work

Enabling the repository's unfinished platform is a separate prerequisite project. The schema contains 38 models and uses PostgreSQL decimals, arrays, JSON, dates, relations, and guarded payment migrations. D1 requires a reviewed schema/data conversion and an appropriate persistence adapter; Hyperdrive connects to an existing database and does not replace its host. Queue processing, sessions, authentication, email, POS webhooks, and payment invariants each require runtime and integration verification before activation.

This migration grants no approval to activate customer accounts, custom checkout/payments, POS synchronization, marketing forms, or email sending. The hosted SkyTab ordering flow remains the customer ordering system.

## Completion record

| Check                                    | Recorded state                                   |
| ---------------------------------------- | ------------------------------------------------ |
| Worker unit tests and type checks        | Passed locally                                   |
| Local Cloudflare API smoke               | Passed: 31 read-only requests                    |
| PostgreSQL backup restore                | Passed in isolated PostgreSQL 17                 |
| Redis backup restore                     | Pending                                          |
| Staging Cloudflare deployment/version    | Deployed: `7e1692dd-cfe3-4295-8edd-2d145c09133a` |
| Production Cloudflare deployment/version | Deployed: `7bbd38d8-c3d6-482b-bb03-354a19576235` |
| Staging API deployed smoke               | Passed: 31 read-only requests                    |
| Production API and frontend checks       | Pending                                          |
| Six-service retirement                   | Pending                                          |
| Final Sevalla inventory/billing review   | Pending                                          |

References: [Workers fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/), [Worker rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/), [D1 import compatibility](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [Hyperdrive](https://developers.cloudflare.com/hyperdrive/get-started/).
