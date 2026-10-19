# Public site asset inventory

This inventory covers imagery selected for the new first-party Milano's website. Source masters live outside the public directory; only optimized derivatives are served.

| Original filename | Source page / record | Original dimensions | Intended use | Milano's ownership status | Optimized output | Descriptive alt text |
|---|---|---:|---|---|---|---|
| `Milanos-Pizzas-Semi-Circle-Logo.png` | Owner attachment `Milanos Pizzas New Semi Circle Logo.png`, October 18, 2026 | 2,741 × 1,636, with alpha | Global header/footer and food-image plate stamp reference | Supplied and authorized directly by the owner | `milanos-semicircle-logo-{160,320}.{avif,webp}` | `Milano's Pizzas logo` |
| `b1c1f4c9-3e3c-43ce-9e96-41daa5dd0d17-scaled.jpeg` (stored as `milanos-davie-interior.jpeg`) | Current [About page](https://www.milanospizzas.com/about-us/), homepage contact background, WordPress media ID 1887 | 2,560 × 1,920 | Homepage hero, About page, social preview | Visibly Milano's-specific and served by the current official site; formal copyright metadata is absent, so owner confirmation remains a launch check | `milanos-davie-interior-{960,1600}.{avif,webp}` and `milanos-davie-og.jpg` | `Dining room and service counter inside Milano's Pizzas in Davie` |

Source integrity hashes:

- `Milanos-Pizzas-Semi-Circle-Logo.png`: SHA-256 `38047F2AB17082248A76BDBFE13316828B813453247E48C81BFA0A901B69BD18`
- `milanos-davie-interior.jpeg`: SHA-256 `C331A584877C7BA9C8DFB086B4416ED5C5AAF7A8757D75F249F5389E82E48C0C`

## Excluded or deferred assets

| Asset | Decision | Reason |
|---|---|---|
| `about_img_.png` / duplicated `hero_img_6_1-2.png` | Excluded; not retained in the public build | Generic template-style pizza image, duplicated in the current media library, with no reliable item identity or conclusive ownership provenance. |
| `newsletter-bg.jpeg` | Deferred | Current media-library food spread, but its caption, alt text, brand linkage, and rights provenance are empty. Requires owner approval before use. |
| Review/customer/delivery-platform images | Prohibited | Third-party/customer photography is outside the approved source boundary. |
| Previous `Milanos-Pizzas-logo.png` and `milanos-logo-*` derivatives | Superseded | The owner supplied a replacement semicircle logo on October 18. The earlier source remains available as a historical asset, but active header/footer references use the new files. |

## Owner-authorized menu images

The owner requested generated food images beginning October 17 and expanded the request to every menu item on October 18. This later authorization supersedes the earlier exclusion of generated dish images. PNG masters and internal provenance live in `apps/web/assets/generated/`; only optimized WebP derivatives are served from `apps/web/public/images/menu/`. `menu-photo-plan.json` records subjects, status and dimensions; `apps/web/src/content/menu-images.json` maps published images to menu slugs. The series remains in progress; this inventory does not claim that every planned image is complete.

The owner explicitly requested removal of the visible illustration captions. Images retain neutral descriptive alt text, and internal generation provenance remains documented. The images are generated representations, not evidence of an actual restaurant photoshoot.

Use the new semicircle logo as a subtle printed ceramic stamp integrated into the front plate rim, following perspective, lighting and glaze rather than appearing as a sticker or overlaid graphic. The complete logo must remain inside the white rim with clear white margins, without crossing the plate edge or overlapping a bowl. All pizza images use thin New York-style crust, with every topping under the cheese except pepperoni on top. The owner confirmed carrots, broccoli, zucchini, cauliflower florets and yellow squash for the Mixed Vegetables side; this replaces the earlier assumed three-vegetable mix. Keep the common white plate, 45-degree angle, dark wood background and soft lighting consistent across the series. Earlier candidates must be checked against these owner corrections before final acceptance.
