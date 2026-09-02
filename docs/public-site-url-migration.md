# Public site URL migration map

The application is a static export, so HTTP status redirects and the bare-domain redirect must be configured at the hosting edge during the authorized launch. Do not create duplicate compatibility pages.

| Existing URL | New target / response | Launch behavior | Reason |
|---|---|---|---|
| `https://milanospizzas.com/*` | `https://www.milanospizzas.com/$1` | Permanent 301/308 | Enforce the approved `www` canonical host. |
| `/` | `/` | 200 | Preserve homepage. |
| `/about-us/` | `/about` | Permanent 301/308 | Closest new story page. |
| `/menu/` | `/menu` | Permanent 301/308 or host normalization | Preserve menu discovery without a duplicate trailing-slash URL. |
| `/catering-menu/` | `/catering` | Permanent 301/308 | Closest new catering page. |
| `/contact-us/` | `/contact` | Permanent 301/308 | Closest new contact/location page. |
| `/privacy-policy/` | `/privacy` | Temporary staging redirect; permanent only after legal approval | New legal route is draft and `noindex`. |
| `/network/` | Gone | 410 preferred; otherwise 404 | Remove the unrelated/low-value page and keep it out of the sitemap. |

## Indexing controls

- Every build defaults to `SITE_ENV=staging`, which emits global `noindex` metadata and a `robots.txt` disallow-all rule.
- Production indexing requires the explicit `SITE_ENV=production` launch setting.
- `/privacy` and `/terms` are always `noindex` and excluded from the sitemap while draft.
- `/specials`, `/loyalty`, and `/reviews` remain `noindex` and sitemap-excluded while their verified content/configuration is disabled.
- `/network/` has no application route and therefore returns the static host's 404 until the preferred edge-level 410 rule is configured.

The current site's duplicate specials/ticker output is not migrated.
