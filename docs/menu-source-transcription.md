# Take-out menu transcription

The owner supplied `NEW MILANO'S PIZZAS TAKE-OUT MENU (AutoRecovered)-1.pdf` for the website menu on October 17, 2026. The two source pages were rendered and visually checked against the catalog. The PDF does not print an issue date; the website directs customers to online ordering to confirm current prices and availability.

Source SHA-256: `54b538f4dcc39ceedd1046eef7f6b34ccb928f92ce71124365084989f2d819f9`.

## Catalog

`apps/web/src/content/menu-catalog.ts` contains 170 distinct entries in 18 categories, including 12 lunch items and 30 catering entries. Alternatives with different food presentations (for example, red and white clam sauce) have separate entries. Sizes use explicit price options; additions use option groups. The data therefore has a different item count from the 128-image creative brief, which also groups sizes and optional additions.

Page 1 supplies the lunch and catering prices, portions, minimum orders and notices. Page 2 supplies appetizers, soups, salads, pasta, chicken, meat, baked dishes, ravioli, kids items, pizza, subs, wings, sides and desserts. The category pages retain their existing URLs. Catering is included in the full menu; no new menu route is needed. No standalone beverage menu or prices were invented.

All existing featured-item slugs are preserved. No dietary badges were inferred from item names. The cauliflower-crust item's printed name includes "Gluten-Free"; this is not a claim about the restaurant's preparation practices.

## Source details retained

- Garlic rolls: $0.60 each, $3.50 per half-dozen, $6.00 per dozen. The PDF gives no further recipe description.
- Cauliflower crust: 12-inch, $16.00, aligned with the 12-inch column in the printed pizza table.
- Beef Brisket with Mushroom Risotto: $20.00. It appears in the PDF even though it is absent from the image brief.
- All wings include fries. Extra fries cost $1.50.
- Lunch: Monday-Friday, 11 AM-3 PM, with a drink and two garlic rolls. Lunch baked ziti additions are pink sauce $1.00 or ricotta $2.00; a mini House or Caesar salad is $2.00.
- Catering penne with pink sauce and peas or broccoli: $70.00 half tray, $95.00 shallow tray, $124.00 deep tray. These unusual figures are preserved exactly as printed.
- Catering Chicken Francaise: $65.00 half tray and $128.00 shallow tray.
- Catering rolls: the printed $3.00 is a tray charge, not the price of a tray of rolls.
- Deli platter: minimum 15 people and 48-hour notice.
- The grilled-chicken catering package lists pasta, sauce, salad and roll alternatives. These are represented as four choice groups to preserve all printed alternatives.

The separate promotional offers printed on page 1 remain available in the PDF download. This menu update does not enable the existing gated specials feature.

## Verification

The catalog was checked against both rendered PDF pages by a second reviewer. All 170 slugs are unique; every item has a finite base price or finite labeled size prices. The first Garlic Rolls image depicts a half-dozen serving, one of the printed portion options.

## Owner-directed image series

On October 18, 2026 the owner supplied `Milanos Pizzas New Semi Circle Logo.png` and requested its use on the website and plate rims, removal of the visible illustration captions, and generated images for every menu item. The exact source is retained as `apps/web/assets/source/Milanos-Pizzas-Semi-Circle-Logo.png`. Internal generated-image provenance remains in `apps/web/assets/generated/README.md`; published images use neutral descriptive alt text.

The owner additionally specified a realistic ceramic printed stamp fired under the glaze for the plate logo, completely inside the white rim with clear white margins and no bowl overlap, and thin New York-style pizza. Every pizza topping belongs under the cheese except pepperoni, which belongs on top. These are owner-provided presentation requirements, not details transcribed from the PDF. They apply across the image series and supersede conflicting earlier candidates or prompts without changing printed menu prices or ingredients.

The owner also confirmed the Mixed Vegetables side's ingredients: carrots, broccoli, zucchini, cauliflower florets and yellow squash. The catalog's short description now records that confirmation, while retaining the printed $4.00 price. This owner-confirmed mix replaces the earlier representative three-vegetable assumption used for image planning.

The owner confirmed tomato sauce for all three adult ravioli fillings: cheese, short rib and wild mushroom. This owner-provided preparation detail supersedes the earlier generic sauce assumption used for image planning; it is separate from the PDF transcription.

`apps/web/assets/generated/menu-photo-plan.json` records every image's subject, prompt, status, dimensions and catalog mappings; `apps/web/src/content/menu-images.json` lists the menu image references. Images are generated sequentially with the built-in image-generation tool, one image per call. Native PNG masters are 1536 × 1024, not 8K, and optimized WebP derivatives supply the website. Identical food across dinner, side, lunch or catering entries may share an image, and size choices may share a representative presentation. Check each delivered image against the latest logo, stamp, pizza and ingredient requirements before accepting it as final.

The completed delivery contains 149 verified PNG/WebP pairs at native 1536 × 1024: 142 mapped images cover all 170 catalog rows, with seven supplemental customization variants delivered separately without adding menu rows. Those variants are Baked Cheese Ravioli, Baked Short Rib Ravioli, Baked Wild Mushroom Ravioli, Salad with Shrimp, Salad with Broccoli, Pasta with Broccoli, and Ricotta & Cheese Red Pizza. All manifest entries are complete, all 170 rows render with an image, and all 149 deployed WebPs match their local SHA-256 hashes.

The final set is deployed to the existing Cloudflare staging Worker, version `2eda50d5-3f78-4eed-9c6b-bda15c69fab9`. Web typecheck, lint, forced staging build, static validators and all 25 live routing smoke checks passed; all 27 HTML pages remain noindex with an empty sitemap. Desktop (1440 px) and mobile (390 px) menu checks confirmed uncropped images, readable prices, working category navigation and no horizontal overflow. The original PDF download also matches the retained source. The live WordPress site, DNS and Amplify remain unchanged by this menu release.
