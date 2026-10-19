# Milano's menu photography series

Created at the owner's request beginning October 17, 2026 using the built-in OpenAI image-generation tool. These are generated food images; this internal provenance record does not assert that the restaurant's served dishes were photographed. On October 18 the owner authorized replacing the logo, removing the visible illustration captions, and generating images for every menu item. Neutral descriptive alt text remains on each published image.

## Sources and delivery

- First item in the owner's original 128-item image brief: Garlic Rolls.
- Master: `Milanos_GarlicRolls.png`. Record the current native dimensions in `menu-photo-plan.json`; the first delivery was 1536 × 1024, not 8K.
- Web delivery: optimized WebP files in `../../public/images/menu/`, indexed by menu slug in `../../src/content/menu-images.json`.
- Current logo reference: `../source/Milanos-Pizzas-Semi-Circle-Logo.png`, supplied directly by the owner on October 18. Preserve its exact semicircle artwork, colors and lettering. The earlier `Milanos-Pizzas-logo.png` is superseded for this series.
- `GarlicRolls.prompt.txt` records the initial delivery prompt. `menu-photo-plan.json` records the expanded subject list, menu mappings, status, dimensions and generation prompts. The current style requirements below supersede any conflicting earlier prompt or generated candidate.
- Portion reference: six rolls, one of the portions printed in the supplied take-out menu. Styling is illustrative; the PDF does not specify the exact preparation or appearance.

## Locked style for subsequent images

Generate one item per image-generation call. Use the owner-supplied semicircle logo and the corrected Garlic Rolls master as references. Preserve the 3:2 composition, 45-degree camera angle, centered white ceramic plate, dark wood table, soft light from upper-left, gentle shadows to lower-right, natural colors and shallow depth of field. Adapt only the dish and the appropriate food-safe serving vessel when the item is a soup or sauce. Do not include people, hands, cutlery, napkins, drinks, props or added text.

The small logo belongs on the front plate rim at six o'clock. Keep the complete design inside the white rim with clear white margins on every side; it must not cross the plate edge or overlap a bowl. It must look like a real ceramic printed stamp integrated into the glaze, following the rim's perspective and lighting. It must not look like a floating graphic, raised sticker, pasted badge or separate object. Keep the supplied design recognizable without letting it overpower the food.

All pizzas must have a thin New York-style crust. Place every topping under the cheese except pepperoni, which goes on top. This applies to signature pizzas, build-your-own variants, kids pizza and lunch pizza as well as the Bruschetta Pizza image. Do not expose other toppings on top of the cheese merely to identify a flavor.

The owner confirmed that the Mixed Vegetables side contains carrots, broccoli, zucchini, cauliflower florets and yellow squash. Show all five vegetables. This confirmation replaces the earlier representative broccoli/carrot/zucchini assumption.

The owner confirmed tomato sauce for all three adult ravioli fillings: cheese, short rib and wild mushroom. Use tomato sauce for each of these images; it is an owner-confirmed preparation, not an assumed sauce choice.

Save each final PNG as `Milanos_[MenuItemName].png` with the menu item name in PascalCase, keeping separately named variants when requested. Preserve accepted masters except for owner-authorized corrections, including the new logo and ceramic stamp treatment. Generate an optimized WebP for the website without changing composition or colors. Record each actual output resolution; never describe a smaller image as native 8K.

## Generation progress

The catalog has 170 menu rows, while the original image brief has 128 numbered entries. The generation plan expands distinct requested presentations and maps shared dishes to the appropriate menu slugs; size choices may share an image. A plan entry is not proof of a completed or published image. Generation and review remain in progress. Use each entry's recorded status and published image map to track delivery, and review earlier candidates against the latest stamp and pizza requirements before treating them as final.

Seven additional customization images are supplemental individual assets: Baked Cheese Ravioli, Baked Short Rib Ravioli, Baked Wild Mushroom Ravioli, Salad with Shrimp, Salad with Broccoli, Pasta with Broccoli, and Ricotta & Cheese Red Pizza. Their plan entries intentionally have empty `menuSlugs` arrays. They are extra imagery for existing menu options, not new purchasable menu rows, and do not appear in the website's menu image map. Deliver their PNG masters and optimized WebP files as supplemental assets when completed; no additional galleries or menu rows are required.

The current staging checkpoint contains 100 completed photographs out of 149 planned, covering 126 catalog rows through Milano's Combo Sub. All 100 optimized images were confirmed in the deployed menu HTML and matched their local SHA-256 hashes. Generation remains in progress, with 49 planned images still to complete, including the seven supplemental variants described above.
