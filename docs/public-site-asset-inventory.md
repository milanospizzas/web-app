# Public site asset inventory

This inventory covers imagery selected for the new first-party Milano's website. Source masters live outside the public directory; only optimized derivatives are served.

| Original filename | Source page / record | Original dimensions | Intended use | Milano's ownership status | Optimized output | Descriptive alt text |
|---|---|---:|---|---|---|---|
| `Milanos-Pizzas-logo.png` | Current `www.milanospizzas.com` header/media library | 11,306 × 8,623 | Global header and footer | Confirmed official Milano's brand mark from the current site; retain owner rights record | `milanos-logo-{160,320}.{avif,webp}` | `Milano's Pizzas logo` |
| `b1c1f4c9-3e3c-43ce-9e96-41daa5dd0d17-scaled.jpeg` (stored as `milanos-davie-interior.jpeg`) | Current [About page](https://www.milanospizzas.com/about-us/), homepage contact background, WordPress media ID 1887 | 2,560 × 1,920 | Homepage hero, About page, social preview | Visibly Milano's-specific and served by the current official site; formal copyright metadata is absent, so owner confirmation remains a launch check | `milanos-davie-interior-{960,1600}.{avif,webp}` and `milanos-davie-og.jpg` | `Dining room and service counter inside Milano's Pizzas in Davie` |

Source integrity hashes:

- `Milanos-Pizzas-logo.png`: SHA-256 `BF55D67F646824F117372836E8C95577B0654E595D88B585D946C2E7896E88A4`
- `milanos-davie-interior.jpeg`: SHA-256 `C331A584877C7BA9C8DFB086B4416ED5C5AAF7A8757D75F249F5389E82E48C0C`

## Excluded or deferred assets

| Asset | Decision | Reason |
|---|---|---|
| `about_img_.png` / duplicated `hero_img_6_1-2.png` | Excluded; not retained in the public build | Generic template-style pizza image, duplicated in the current media library, with no reliable item identity or conclusive ownership provenance. |
| `newsletter-bg.jpeg` | Deferred | Current media-library food spread, but its caption, alt text, brand linkage, and rights provenance are empty. Requires owner approval before use. |
| Review/customer/delivery-platform images | Prohibited | Third-party/customer photography is outside the approved source boundary. |
| AI-generated dish images | Prohibited | They cannot represent actual Milano's menu items. |

No named featured dish is currently published with photography. The featured-item model filters out entries that do not have a real, approved item image.
