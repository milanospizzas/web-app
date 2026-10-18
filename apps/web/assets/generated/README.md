# Milano's menu photography series

Created at the owner's request on 2026-10-17 using the built-in OpenAI image-generation tool. These are AI-generated food illustrations, not photographs of dishes served by the restaurant. Display a short illustration caption with each image.

## First image

- Item 1 of the owner's 128-item image list: Garlic Rolls.
- Master: `Milanos_GarlicRolls.png`, native 1536 × 1024 PNG. It is not an 8K output.
- Web delivery: `../../public/images/menu/garlic-rolls.webp`, same dimensions, quality 88 WebP.
- Prompt: `GarlicRolls.prompt.txt`.
- Logo reference: `../source/Milanos-Pizzas-logo.png`.
- Portion reference: six rolls, one of the portions printed in the supplied take-out menu. Styling is illustrative; the PDF does not specify the exact preparation or appearance.

## Locked style for subsequent images

Generate one item per image-generation call. Use both the original logo and this Garlic Rolls master as references for subsequent images. Preserve the 3:2 composition, 45-degree camera angle, centered white ceramic plate, dark wood table, soft light from upper-left, gentle shadows to lower-right, natural colors and shallow depth of field. Keep the small logo printed on the front plate rim at six o'clock. Do not include people, hands, cutlery, napkins, drinks, props or added text. Adapt only the dish and the appropriate food-safe serving vessel when the item is a soup or sauce.

Save each original PNG as `Milanos_[MenuItemName].png` with the menu item name in PascalCase, keeping separately named variants when the owner requests them. Preserve masters unchanged. Generate an optimized WebP for the website without changing composition or colors. Record each actual output resolution; never describe a smaller image as native 8K.

Only Garlic Rolls has been generated in this first delivery. The next requested item is Pasta Fagioli. The remaining images are not placeholders or claims of completed work.
