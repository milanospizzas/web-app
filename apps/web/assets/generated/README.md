# Milano's menu photography series

Created at the owner's request beginning October 17, 2026 using the built-in OpenAI image-generation tool. These are generated food images; this internal provenance record does not assert that the restaurant's served dishes were photographed. On October 18 the owner authorized replacing the logo, removing the visible illustration captions, and generating images for every menu item. Neutral descriptive alt text remains on each published image.

## Sources and delivery

- First item in the owner's original 128-item image brief: Garlic Rolls.
- Masters: `Milanos_[MenuItemName].png`, native 1536 × 1024 pixels (3:2), including `Milanos_GarlicRolls.png`. These are not native 8K images and are not upscaled to imply otherwise.
- Web delivery: optimized WebP files in `../../public/images/menu/`, indexed by menu slug in `../../src/content/menu-images.json`.
- Current logo reference: `../source/Milanos-Pizzas-Semi-Circle-Logo.png`, supplied directly by the owner on October 18. Preserve its exact semicircle artwork, colors and lettering. The earlier `Milanos-Pizzas-logo.png` is superseded for this series.
- `GarlicRolls.prompt.txt` records the initial delivery prompt. `menu-photo-plan.json` is the complete prompt/provenance manifest: every delivered image has its subject, generation prompt, menu mappings, status and actual dimensions recorded there. The current style requirements below supersede any conflicting earlier prompt or generated candidate.
- Portion reference: six rolls, one of the portions printed in the supplied take-out menu. Styling is illustrative; the PDF does not specify the exact preparation or appearance.

## Locked style for subsequent images

Generate images sequentially with the built-in image-generation tool, one item per call. Use the owner-supplied semicircle logo and the corrected Garlic Rolls master as references. Preserve the 3:2 composition, 45-degree camera angle, centered white ceramic plate, dark wood table, soft light from upper-left, gentle shadows to lower-right, natural colors and shallow depth of field. Adapt only the dish and the appropriate food-safe serving vessel when the item is a soup or sauce. Do not include people, hands, cutlery, napkins, drinks, props or added text.

The small logo belongs on the front plate rim at six o'clock. Keep the complete design inside the white rim with clear white margins on every side; it must not cross the plate edge or overlap a bowl. It must look like a real ceramic printed stamp fired under the glaze, following the rim's perspective and lighting. It must not look like a floating graphic, raised sticker, pasted badge or separate object. Keep the supplied design recognizable without letting it overpower the food.

All pizzas must have a thin New York-style crust. Place every topping under the cheese except pepperoni, which goes on top. This applies to signature pizzas, build-your-own variants, kids pizza and lunch pizza as well as the Bruschetta Pizza image. Do not expose other toppings on top of the cheese merely to identify a flavor.

The owner confirmed that the Mixed Vegetables side contains carrots, broccoli, zucchini, cauliflower florets and yellow squash. Show all five vegetables. This confirmation replaces the earlier representative broccoli/carrot/zucchini assumption.

The owner confirmed tomato sauce for all three adult ravioli fillings: cheese, short rib and wild mushroom. Use tomato sauce for each of these images; it is an owner-confirmed preparation, not an assumed sauce choice.

Save each final PNG as `Milanos_[MenuItemName].png` with the menu item name in PascalCase, keeping separately named variants when requested. Preserve accepted masters except for owner-authorized corrections, including the new logo and ceramic stamp treatment. Generate an optimized WebP for the website without changing composition or colors. Record each actual output resolution; never describe a smaller image as native 8K.

## Delivery scope and verification

The final deliverable comprises 149 individual PNG masters and their optimized WebP counterparts. Of these, 142 images map to all 170 catalog rows, with shared dishes and size choices reusing the appropriate image. Seven supplemental customization variants complete the set. This differs from the owner's original 128 numbered entries because the plan separates requested presentations and also covers the full transcribed catalog.

The seven supplemental assets are Baked Cheese Ravioli, Baked Short Rib Ravioli, Baked Wild Mushroom Ravioli, Salad with Shrimp, Salad with Broccoli, Pasta with Broccoli, and Ricotta & Cheese Red Pizza. Their plan entries intentionally have empty `menuSlugs` arrays. They provide imagery for existing menu options, do not create new purchasable menu rows, and do not appear in the menu image map. Their PNG masters and optimized WebP files are part of the deliverable; no additional galleries or menu rows are required.

The complete set is now verified and deployed to the existing Cloudflare staging Worker at `https://milanos-pizza-web-staging.bautistajose95.workers.dev/menu`, version `2eda50d5-3f78-4eed-9c6b-bda15c69fab9`. All 149 manifest entries are complete, all 149 unique PNG/WebP pairs passed dimensions and integrity checks, and the 142 mapped images cover all 170 catalog rows. Every live WebP matches its local SHA-256; the original menu PDF and four logo derivatives also match. Native masters remain 1536 × 1024, not 8K.

Web typecheck, full lint, the forced staging build and static validators passed. The export contains 27 noindex HTML pages and an empty sitemap; all 25 live routing smoke requests passed. Desktop (1440 px) and mobile (390 px) checks confirmed no horizontal overflow, uncropped 3:2 food images, readable prices and category navigation, the replacement header logo, and no visible illustration captions. The final Garlic Rolls image shows six distinct rolls. Staging verification does not publish this menu to the live WordPress site or change DNS or Amplify.
