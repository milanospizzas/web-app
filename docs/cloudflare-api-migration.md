# Cloudflare API migration and Sevalla retirement

Completed October 16, 2026: both Cloudflare API Workers are verified, and all six Sevalla services have been deleted after successful PostgreSQL/Redis backup restoration and all six CI jobs at `9bad1ca`. Post-deletion API and frontend smoke checks passed. WordPress, Amplify, DNS, and repository worktrees remain unchanged.

The owner authorized replacing the Milano API services on Sevalla and retiring the six listed services after verified backups and replacement checks. The live WordPress site, AWS Amplify, and DNS remain unchanged. The static frontend continues to use its existing [Cloudflare staging preview](cloudflare-static-staging.md).

## What was replaced

The repository's public frontend reads its menu and content from the static export and hands ordering to SkyTab. It has no callers of the repository's dormant API client. The production API defaults its custom ordering, payment, and account flags to false; those flags were absent from the inspected deployment. Its intended public surface is `/health` with custom endpoints unavailable.

The older Sevalla development deployment registered legacy routes unconditionally, but its inspected database contained no application tables. Those unfinished routes were not promoted into the replacement. This migration preserves the current public site's behavior and keeps the future ordering platform disabled.

| Former Sevalla service     | Role                               | Retirement status |
| -------------------------- | ---------------------------------- | ----------------- |
| `milanos-pizza-api-prod`   | Production API application         | Deleted           |
| `milanos-pizza-api-dev`    | Legacy development API application | Deleted           |
| `milanos-pizza-prod`       | Production PostgreSQL database     | Deleted           |
| `milanos-pizza-dev`        | Development PostgreSQL database    | Deleted           |
| `milanos-pizza-redis-prod` | Production Redis database          | Deleted           |
| `milanos-pizza-redis-dev`  | Development Redis database         | Deleted           |

Neither API application had a custom domain, and no active API caller was found that needed updating. No DNS cutover was needed. Provider-owned Sevalla URLs cannot be transferred to Cloudflare and are no longer supported after retirement; future integrations must use the Cloudflare destinations below.

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

Full encrypted PostgreSQL application-database dumps have been restored into isolated PostgreSQL 17 instances, and their application-object catalogs match the inspected empty source catalogs. Both Redis RDB backups have been restored under Redis 8.2.2, matching the empty source keyspaces, zero stored functions, and built-in `vectorset` version 1 module. Encrypted-transfer SHA-256 verification, successful decryption, and restored RDB SHA-256 verification passed. Backup files, credentials, detailed inventory, and restore evidence stay in the owner's private backup location; they must not be added to Git, CI artifacts, public logs, or this runbook.

The following retirement checks have passed:

- [x] PostgreSQL and Redis backup integrity checks and successful isolated restores, including matching source/restore inventories.
- [x] Exact application/service inventory, with no WordPress dependency or other active consumer found. Inspected Sevalla static-site, object-storage, and load-balancer inventories were empty.
- [x] Both Cloudflare API Workers passed 31 deployed read-only smoke requests each. Source verification is recorded at `9bad1ca`; deployed version IDs are below.
- [x] The static frontend passed 25 HTTP checks and fresh browser home/order navigation checks, retaining SkyTab links and making no requests to the retiring APIs.
- [x] No API caller updates, custom-domain changes, or DNS changes were needed. Read-only verification found the live WordPress site unchanged.
- [x] Recovery instructions and private access to the preserved configuration and backups are available.

All six named services were deleted after those checks passed. Final Sevalla Applications, Databases, and Home views showed empty onboarding states; there were no static sites, object storage, or load balancers. The account, repository branches/worktrees, WordPress, Amplify, and DNS were not changed.

After deletion, both Cloudflare APIs again passed 31 read-only smoke checks each, the frontend passed 25 HTTP checks, and WordPress home/about returned HTTP 200 with unchanged content. The usage dashboard still displayed $14.36 accrued usage and a $31.74 projection, limited to application/database compute. Those historical and lagging billing figures do not establish the final invoice; accrued charges remain payable despite the empty service inventory.

## Rollback

Sevalla retirement is complete, so the deleted services cannot simply be resumed. Cloudflare version rollback remains available for later Worker updates; recovering Sevalla requires the private-backup restoration procedure below. The static site and live WordPress site require no change because they do not call these Workers.

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

| Check                                    | Recorded state                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Worker unit tests and type checks        | Passed locally                                                         |
| Local Cloudflare API smoke               | Passed: 31 read-only requests                                          |
| PostgreSQL backup restore                | Passed in isolated PostgreSQL 17                                       |
| Redis backup restore                     | Passed: both Redis 8.2.2 RDB restores and integrity checks             |
| Staging Cloudflare deployment/version    | Deployed: `7e1692dd-cfe3-4295-8edd-2d145c09133a`                       |
| Production Cloudflare deployment/version | Deployed: `7bbd38d8-c3d6-482b-bb03-354a19576235`                       |
| Staging API deployed smoke               | Passed after deletion: 31 read-only requests                           |
| Production API deployed smoke            | Passed after deletion: 31 read-only requests                           |
| Frontend verification                    | Passed: browser home/order navigation and 25 post-deletion HTTP checks |
| Repository CI                            | Passed: all six jobs at `9bad1ca`                                      |
| WordPress verification                   | Home/about HTTP 200 and unchanged after deletion                       |
| Six-service retirement                   | Complete: all six deleted October 16, 2026                             |
| Final Sevalla inventory/billing review   | Passed: empty service inventory; accrued charges remain                |

References: [Workers fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/), [Worker rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/), [D1 import compatibility](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [Hyperdrive](https://developers.cloudflare.com/hyperdrive/get-started/).
