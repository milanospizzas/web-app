# Cloudflare static staging

This deployment runs the existing Next.js static export on Cloudflare Workers Static Assets at a `workers.dev` hostname. It is a staging preview, not a public launch or a WordPress replacement.

The Cloudflare account is the owner-selected `Bautistajose95@gmail.com's Account`; the Worker name is `milanos-pizza-web-staging`. `wrangler.jsonc` is the source of truth. It contains no custom domains, zone routes, database bindings, API proxy, backend secrets, or paid-service bindings. Amplify remains available. WordPress, DNS, existing branches/worktrees, and other services are unchanged. The later owner-authorized [Cloudflare API replacement and Sevalla retirement](cloudflare-api-migration.md) is tracked separately; its retirement checks are pending, and this static preview does not depend on the API.

## Build and deploy

Use Node.js 22 or newer for Wrangler (verified with Node 24) and pnpm 9.15.9. Wrangler is pinned in the lockfile; do not rely on a global version.

```sh
pnpm install --frozen-lockfile
pnpm check:cloudflare
pnpm exec wrangler deploy --dry-run
pnpm preview:cloudflare
# In another terminal:
pnpm smoke:cloudflare http://127.0.0.1:8787
```

`wrangler deploy` and `wrangler dev` both invoke the checked-in custom build command. It builds only shared/web, forces the approved staging configuration, runs the existing static validator, and independently rejects indexable output before preparing Cloudflare headers and redirects. Do not deploy a copied `out` directory with an ad hoc command: earlier production validation may have left production-indexed files there.

After the reviewed local checks and Cloudflare authentication:

```sh
pnpm deploy:cloudflare
pnpm exec wrangler deployments list
pnpm smoke:cloudflare https://THE-RETURNED-PREVIEW.workers.dev
```

Use the actual URL returned by Cloudflare. Deployment must stop on an account mismatch or an unexpected existing Worker. A normal deployment is authorized only for this staging Worker. Do not pass `--routes`, `--domains`, or an alternate account/name override. Do not connect a production domain, change DNS, upgrade the account plan, or retire Amplify as part of this setup.

For owner login, Wrangler can use the narrower OAuth scopes `account:read user:read workers_scripts:write`; DNS/zone-route write scopes are unnecessary. Credentials stay in the owner's local secure Wrangler credential storage. Never commit them. A repository build alone needs no Cloudflare credentials.

## Runtime behavior

- Existing exported HTML, CSS, JavaScript, images, and metadata are served as static assets.
- All staging pages are noindex; `robots.txt` disallows all crawling and the sitemap is empty. Static responses also carry `X-Robots-Tag: noindex, nofollow`.
- Generated redirects retain the existing no-trailing-slash URLs. Unknown routes use the exported 404 page, not a successful homepage fallback.
- Only `/network` and `/network/` are routed to the tiny Worker before asset lookup, preserving HTTP 410 and noindex for GET/HEAD. Missing assets can also fall through to the Worker, which delegates to the asset binding. No request is forwarded to Sevalla or Shift4.
- `/order` keeps the native same-tab SkyTab links, approved source allowlist, and removal of incoming UTM passthrough. Custom ordering, payments, accounts, analytics, specials, loyalty, and marketing signup remain off.
- Only hashed Next bundles receive immutable caching. Ordinary HTML and image filenames remain revalidated so future asset edits do not stay cached for a month.

## Verification and release boundaries

The automated smoke uses only local or `workers.dev` origins. It checks route availability, headers/indexing, static asset loading, 404/410 behavior, query-preserving canonical redirects, and native no-JavaScript order anchors. Browser verification should additionally check client navigation, the mobile Quick ordering landmark when visible, the source/UTM filtering after hydration, and absence of unintended API requests. Do not click through to submit an order or payment.

The existing announcement-bar landmark issue and other deferred accessibility/launch requirements remain open. This migration does not approve production SEO, legal/forms, menu publication, custom payments, Shift4 certification, or public cutover.

Normal static-asset requests are free within Cloudflare's platform limits. The small Worker uses the account's Workers request allowance for its routed requests. No paid plan is required by this configuration. Amplify charges continue while it remains active; Sevalla charges continue until its separately tracked retirement checks and service removal are completed.

## Rollback and future automation

The preview is additive: no current customer traffic or existing deployment is redirected to it. Retain the prior Cloudflare version ID before later updates; use Cloudflare version rollback only for this Worker if separately authorized. Do not reset main or alter the WordPress/DNS setup.

Deployment is intentionally explicit for this first migration. No main-branch push, merge, GitHub deployment secret, or automatic provider build connection is required to publish the preview. The later API migration removes only the obsolete placeholder Sevalla job from the manual deployment workflow; the Amplify job is unchanged. A later CI connection can reuse the same staging build and smoke commands after its access and trigger scope are approved.

References: [Static assets](https://developers.cloudflare.com/workers/static-assets/), [routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [headers](https://developers.cloudflare.com/workers/static-assets/headers/), [billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
