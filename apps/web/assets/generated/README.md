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

Save each final PNG as `Milanos_[MenuItemName].png` with the menu item name in PascalCase, keeping separately named variants when requested. Preserve accepted masters except for owner-authorized corrections, including the new logo and ceramic stamp treatment. Generate an optimized WebP for the website without changing composition or colors. Record each actual output resolution; never describe a smaller image as native 8K.

## Generation progress

The catalog has 170 menu rows, while the original image brief has 128 numbered entries. The generation plan expands distinct requested presentations and maps shared dishes to the appropriate menu slugs; size choices may share an image. A plan entry is not proof of a completed or published image. Generation and review remain in progress. Use each entry's recorded status and published image map to track delivery, and review earlier candidates against the latest stamp and pizza requirements before treating them as final.

The October 18 staging checkpoint contains 51 completed photographs out of 149 planned, covering 76 catalog rows through Eggplant Rollatini with Pasta. All 51 optimized images were confirmed in the deployed menu HTML and matched their local SHA-256 hashes. This checkpoint does not mark the remaining 98 planned images complete.
