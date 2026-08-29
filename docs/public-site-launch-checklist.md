# Milano's public site launch checklist

No deployment or DNS change is authorized by the implementation work itself. Complete these checks only after owner launch approval.

## Business facts and content

- [ ] Reverify Sunday opening time against the active Google Business Profile immediately before launch.
- [ ] Confirm the address remains `7613 Davie Road Extension, Davie, FL 33024` everywhere.
- [ ] Confirm `(954) 404-9143` and `davie@milanospizzas.com` are current.
- [ ] Obtain the exact Google Business Profile place URL before enabling review buttons or review-page indexing.
- [ ] Obtain owner confirmation for the reused branded interior photograph and preserve the rights record.
- [ ] Attach only real, approved Milano's dish photos to named featured items.
- [ ] Compare every proposed displayed price against the current POS before setting any non-null menu price.
- [ ] Review and approve final privacy and terms language before indexing or adding either page to a sitemap.

## Ordering and security boundary

- [ ] Set `ORDER_PROVIDER=skytab` and `ORDER_MODE=redirect`.
- [ ] Set the approved public `SKYTAB_ORDER_URL`; verify its hostname remains `online.skytab.com`.
- [ ] Keep `SKYTAB_IFRAME_ENABLED=false` in production.
- [ ] Keep `CUSTOM_ORDERING_ENABLED=false`, `CUSTOM_PAYMENT_ENABLED=false`, and `ACCOUNTS_ENABLED=false` until their separate approvals are complete.
- [ ] Confirm `/api/auth/*`, `/api/menu/*`, `/api/orders/*`, `/api/pos/*`, and all custom payment paths remain unavailable with the default flags.
- [ ] Verify no historical Shift4 credentials are mounted into the production runtime.
- [ ] Exercise `/order?source=homepage-hero` on desktop and mobile and confirm same-tab SkyTab redirection plus source/UTM preservation.
- [ ] Confirm the direct-order fallback works with browser scripting disabled or a redirect failure.

## Forms and analytics

- [ ] Send a test catering inquiry to `davie@milanospizzas.com`; confirm the email-app handoff and consent wording.
- [ ] Confirm the catering form neither collects payment nor sends form fields to analytics.
- [ ] Leave `ANALYTICS_ENABLED=false` until a valid GA4 measurement ID and owner approval are present.
- [ ] When analytics is approved, supply `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, then verify only the approved non-PII events.
- [ ] Keep loyalty and marketing forms hidden until the platform, consent text, unsubscribe handling, HTTPS/CORS destination, and privacy copy are approved.
- [ ] Replace the draft privacy page, mark its code-level content status approved, and only then enable `PRIVACY_COPY_APPROVED`.

## SEO, hosting, and release

- [ ] Configure the bare-domain permanent redirect to the `www` canonical host.
- [ ] Apply the redirect/410 rules in `docs/public-site-url-migration.md` at the hosting edge.
- [ ] Confirm production outputs indexable `robots.txt` and `sitemap.xml`; confirm staging remains disallow-all.
- [ ] Check unique title, description, canonical, H1, Open Graph, Twitter, Restaurant JSON-LD, and Breadcrumb JSON-LD on every indexable page.
- [ ] Validate the production sitemap and submit it only after the authorized launch.
- [ ] Verify the `www` property in Google Search Console and inspect migrated URLs.
- [ ] Confirm the deployment workflow still requires an explicit manual `DEPLOY` confirmation.
- [ ] Run type checks, API gate tests, the production static build, route smoke checks, and a final credential/legacy-domain scan.
