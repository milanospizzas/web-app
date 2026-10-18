import type { MenuCategory, MenuItem, MenuOptionGroup, MenuPriceOption } from './menu';

// Transcribed from the owner-provided two-page take-out menu. Prices are USD.
// Sizes and alternatives are kept explicit; a missing size is never inferred.
type CatalogItem = Pick<MenuItem, 'name' | 'slug' | 'category' | 'shortDescription'> &
  Partial<
    Pick<MenuItem, 'displayedPrice' | 'priceOptions' | 'optionGroups' | 'notes' | 'sourcePage'>
  >;

const sizes = (small: number, medium: number, large: number): MenuPriceOption[] => [
  { label: '9-inch', price: small },
  { label: '12-inch', price: medium },
  { label: '16-inch', price: large },
];
const portions = (labels: string[], prices: number[]): MenuPriceOption[] =>
  labels.map((label, index) => ({ label, price: prices[index] }));
const choices = (label: string, values: string[]): MenuOptionGroup => ({
  label,
  choices: values.map((value) => ({ label: value })),
});
const item = (
  category: MenuCategory,
  slug: string,
  name: string,
  price: number | MenuPriceOption[],
  shortDescription = '',
  options: Partial<CatalogItem> = {}
): CatalogItem => ({
  category,
  slug,
  name,
  shortDescription,
  sourcePage: 2,
  ...(Array.isArray(price)
    ? { displayedPrice: null, priceOptions: price }
    : { displayedPrice: price }),
  ...options,
});

const pastaChoices = choices('Pasta choice', ['Spaghetti', 'Penne', 'Bowties', 'Fettuccini']);
const pastaAdditions: MenuOptionGroup = {
  label: 'Add to your pasta',
  choices: [
    { label: 'Shrimp', price: 6 },
    { label: 'Grilled chicken', price: 6 },
    { label: 'Broccoli', price: 4 },
    { label: 'Peas', price: 2 },
  ],
};
const saladOptions: MenuOptionGroup[] = [
  {
    label: 'Add to any salad',
    choices: [
      { label: 'Chicken', price: 5 },
      { label: 'Shrimp', price: 6 },
      { label: 'Broccoli', price: 4 },
    ],
  },
  choices('Dressing', [
    'Ranch',
    'Caesar',
    'Balsamic vinaigrette',
    'Red wine',
    'Creamy Italian',
    'Blue cheese',
  ]),
];
const pizzaOptions: MenuOptionGroup[] = [
  {
    label: 'Extras',
    choices: [
      { label: 'Extra cheese', price: 2 },
      { label: 'Extra ingredient - small', price: 1 },
      { label: 'Extra ingredient - medium', price: 1.5 },
      { label: 'Extra ingredient - large', price: 2 },
      { label: 'Chicken', price: 3 },
      { label: 'Shrimp', price: 5.5 },
    ],
  },
];
const bakedOptions: MenuOptionGroup[] = [
  {
    label: 'Additions',
    choices: [
      { label: 'Extra cheese', price: 2 },
      { label: 'Alfredo sauce', price: 2 },
      { label: 'Pink sauce', price: 2 },
    ],
  },
];

export const menuCategoryNotes: Partial<Record<MenuCategory, string[]>> = {
  Pizza: [
    'Pizza sizes are 9-inch, 12-inch and 16-inch. Cauliflower crust is available in 12-inch.',
  ],
  'Specialty Pizza': ['Signature pizza sizes are 9-inch, 12-inch and 16-inch.'],
  Pasta: ['Choose spaghetti, penne, bowties or fettuccini for a pasta dish.'],
  Wings: ['All wings include fries. Extra fries are $1.50.'],
  'Lunch Menu': [
    'Monday through Friday, 11 AM to 3 PM.',
    'Lunch items include a drink and two garlic rolls.',
    'Add a mini House or Caesar salad for $2.00.',
  ],
  Catering: [
    'Tray sizes: half tray serves 5-10; shallow tray serves 10-20; deep tray serves 30-40, unless a different serving count is listed.',
    'Package minimums and platter serving counts are listed with each item.',
  ],
};

export const menuCatalog: CatalogItem[] = [
  item(
    'Appetizers',
    'garlic-rolls',
    'Garlic Rolls',
    portions(['Each', 'Half-dozen', 'Dozen'], [0.6, 3.5, 6]),
    'Choose a single roll, a half-dozen or a dozen.'
  ),
  item(
    'Appetizers',
    'bruschetta-pizza',
    'Bruschetta Pizza',
    10,
    'Our famous 12-inch bruschetta pizza.'
  ),
  item(
    'Appetizers',
    'baked-cheese-balls',
    'Baked Cheese Balls with Marinara',
    10,
    'Baked cheese balls with a side of marinara.'
  ),
  item('Appetizers', 'baked-meatballs-mozzarella', 'Baked Meatballs with Mozzarella', 7),
  item('Appetizers', 'baked-sausage-links-mozzarella', 'Baked Sausage Links with Mozzarella', 7),
  item('Appetizers', 'mussels-marinara-appetizer', 'Mussels Marinara', 10),
  item(
    'Appetizers',
    'meatball-parm-sliders',
    'Meatball Parm Sliders',
    10,
    'Four signature sliders.'
  ),
  item('Appetizers', 'chicken-parm-sliders', 'Chicken Parm Sliders', 10, 'Four signature sliders.'),
  item(
    'Appetizers',
    'sloppy-sausage-parm-sliders',
    'Sloppy Sausage Parm Sliders',
    10,
    'Four signature sliders.'
  ),
  item(
    'Soups',
    'pasta-fagioli',
    'Pasta Fagioli',
    portions(['Cup', 'Bowl', 'Quart'], [4.5, 6.5, 10])
  ),
  item('Soups', 'minestrone', 'Minestrone', portions(['Cup', 'Bowl', 'Quart'], [4.5, 6.5, 10])),

  item(
    'Salads',
    'antipasto-salad',
    'Antipasto Salad',
    13,
    'Iceberg lettuce, capicola, salami, provolone, black olives, green peppers, pepperoncini and tomatoes.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'house-salad',
    'House Salad',
    portions(['Small', 'Large', 'Family'], [4, 8, 12]),
    'Iceberg lettuce, tomatoes, cucumber and black olives.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'caesar-salad',
    'Caesar Salad',
    portions(['Small', 'Large', 'Family'], [4, 8, 12]),
    'Romaine lettuce, croutons, Parmesan cheese and Caesar dressing.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'milanos-salad',
    "Milano's Salad",
    11,
    'Romaine lettuce, tomatoes, blue cheese, Gorgonzola cheese and fresh basil.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'gorgonzola-salad',
    'Gorgonzola Salad',
    11,
    'Romaine lettuce, black olives, tomatoes, croutons, onions and Gorgonzola.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'burrata-cheese-salad',
    'Burrata Cheese Salad',
    11,
    'Iceberg lettuce, black olives, tomatoes, cucumbers and burrata cheese.',
    { optionGroups: saladOptions }
  ),
  item(
    'Salads',
    'fresh-mozzarella-tomato-salad',
    'Fresh Mozzarella & Tomato Salad',
    11,
    'Romaine lettuce, tomatoes, fresh mozzarella and fresh basil.',
    { optionGroups: saladOptions }
  ),

  ...['Spaghetti', 'Penne', 'Bowties', 'Fettuccini'].map((pasta) =>
    item('Pasta', `${pasta.toLowerCase()}-tomato-sauce`, `${pasta} with Tomato Sauce`, 9, '', {
      optionGroups: [pastaAdditions],
    })
  ),
  ...(
    [
      ['marinara-pasta', 'Pasta with Marinara Sauce', 10.5],
      ['meat-sauce-pasta', 'Pasta with Meat Sauce', 10.5],
      ['mushroom-marinara-pasta', 'Pasta with Mushroom Marinara', 10],
      ['meatballs-sausage-pasta', 'Meatballs and Sausage Pasta', 12],
      ['pink-sauce-pasta', 'Pasta with Pink Sauce', 11],
      ['alfredo-pasta', 'Pasta with Alfredo Sauce', 11],
      ['pesto-pasta', 'Pasta with Pesto Sauce', 13],
      ['pink-sauce-bacon-pasta', 'Pink Sauce Pasta with Bacon', 12.5],
      ['alfredo-bacon-pasta', 'Alfredo Pasta with Bacon', 12.5],
      ['white-clam-sauce-pasta', 'Pasta with White Clam Sauce', 13],
      ['red-clam-sauce-pasta', 'Pasta with Red Clam Sauce', 13],
      ['shrimp-clams-arrabbiata', 'Shrimp & Clams Arrabbiata', 18],
      ['shrimp-marinara-pasta', 'Shrimp Marinara Pasta', 15],
      ['mussels-marinara-pasta', 'Mussels Marinara Pasta', 14],
    ] as const
  ).map(([slug, name, price]) =>
    item('Pasta', slug, name, price, '', { optionGroups: [pastaChoices, pastaAdditions] })
  ),

  item('Chicken Dishes', 'chicken-parmigiana', 'Chicken Parmigiana Dinner', 16.5),
  item('Chicken Dishes', 'chicken-cutlet-dinner', 'Chicken Cutlet Dinner', 15.5),
  item('Chicken Dishes', 'chicken-marsala', 'Chicken Marsala', 17),
  item('Chicken Dishes', 'chicken-francaise', 'Chicken Francaise', 17),
  item('Chicken Dishes', 'grilled-chicken-broccoli', 'Grilled Chicken and Broccoli', 15.5),
  item('Meat Dishes', 'sausage-peppers', 'Sausage and Peppers', 16),
  item('Meat Dishes', 'beef-brisket-mushroom-risotto', 'Beef Brisket with Mushroom Risotto', 20),

  ...(
    [
      ['lasagna', 'Lasagna', 12],
      ['baked-ziti', 'Baked Ziti', 12],
      ['baked-ziti-meatballs', 'Baked Ziti with Meatballs', 14],
      ['baked-ziti-sausage', 'Baked Ziti with Sausage', 14],
      ['baked-ziti-ricotta', 'Baked Ziti with Ricotta', 14],
      ['baked-ziti-pink-sauce', 'Baked Ziti with Pink Sauce', 14],
      ['eggplant-parmigiana-pasta', 'Eggplant Parmigiana with Pasta', 13],
      ['eggplant-rollatini-pasta', 'Eggplant Rollatini with Pasta', 14],
    ] as const
  ).map(([slug, name, price]) =>
    item('Baked Dishes', slug, name, price, '', { optionGroups: bakedOptions })
  ),
  ...(
    [
      ['cheese-ravioli', 'Cheese Ravioli', 12],
      ['short-rib-ravioli', 'Short Rib Ravioli', 13],
      ['wild-mushroom-ravioli', 'Wild Mushroom Ravioli', 13],
    ] as const
  ).map(([slug, name, price]) =>
    item('Ravioli', slug, name, price, '', {
      optionGroups: [
        { label: 'Preparation', choices: [{ label: 'Baked with mozzarella', price: 2 }] },
      ],
    })
  ),
  ...(
    [
      ['kids-pasta-meatball', 'Kids Pasta with Meatball', 7],
      ['kids-baked-ziti', 'Kids Baked Ziti', 8],
      ['kids-baked-ziti-ricotta', 'Kids Baked Ziti with Ricotta', 9.5],
      ['kids-pizza', 'Kids Pizza', 8.5],
      ['kids-meat-ravioli', 'Kids Meat Ravioli', 7.5],
      ['kids-cheese-ravioli', 'Kids Cheese Ravioli', 7.5],
      ['kids-pasta-butter', 'Kids Pasta with Butter', 6],
      ['kids-pasta-tomato-sauce', 'Kids Pasta with Tomato Sauce', 6],
      ['kids-pasta-alfredo', 'Kids Pasta with Alfredo', 7.5],
      ['kids-pasta-pink-sauce', 'Kids Pasta with Pink Sauce', 7.5],
    ] as const
  ).map(([slug, name, price]) => item('Kids Menu', slug, name, price)),

  item('Pizza', 'cheese-pizza', 'Cheese Pizza', sizes(8.5, 13, 16), '', {
    optionGroups: pizzaOptions,
  }),
  item(
    'Pizza',
    'ricotta-cheese-pizza',
    'Ricotta & Cheese Pizza',
    sizes(10, 15, 19),
    'Choose red or white.',
    { optionGroups: [choices('Style', ['Red', 'White']), ...pizzaOptions] }
  ),
  item('Pizza', 'milanos-sauce-pizza', "Milano's Sauce Pizza", sizes(8.5, 13, 16), '', {
    optionGroups: pizzaOptions,
  }),
  ...(
    [
      ['pepperoni-pizza', 'Pepperoni Pizza'],
      ['sausage-pizza', 'Sausage Pizza'],
      ['meatball-pizza', 'Meatball Pizza'],
      ['ham-pizza', 'Ham Pizza'],
      ['bacon-pizza', 'Real Bacon Pizza'],
      ['mushroom-pizza', 'Mushroom Pizza'],
      ['onion-pizza', 'Onion Pizza'],
      ['black-olive-pizza', 'Black Olive Pizza'],
      ['green-pepper-pizza', 'Green Pepper Pizza'],
      ['fresh-basil-pizza', 'Fresh Basil Pizza'],
      ['fresh-garlic-pizza', 'Fresh Garlic Pizza'],
      ['fresh-tomato-pizza', 'Fresh Tomato Pizza'],
      ['anchovy-pizza', 'Anchovy Pizza'],
      ['chicken-pizza', 'Chicken Breast Pizza'],
    ] as const
  ).map(([slug, name]) =>
    item('Pizza', slug, name, sizes(9.5, 14.5, 18), 'With cheese.', { optionGroups: pizzaOptions })
  ),
  item(
    'Pizza',
    'cauliflower-crust-pizza',
    'Gluten-Free Cauliflower Crust Pizza',
    [{ label: '12-inch', price: 16 }],
    'Cauliflower crust.'
  ),
  item(
    'Specialty Pizza',
    'margherita-pizza',
    'Margherita Pizza',
    sizes(11.75, 17.5, 22),
    "Milano's sauce, fresh tomato, basil and garlic.",
    { optionGroups: pizzaOptions }
  ),
  item(
    'Specialty Pizza',
    'vegetarian-special-pizza',
    'Vegetarian Special Pizza',
    sizes(13.75, 19, 24),
    'Green peppers, black olives, garlic, mushrooms and onions.',
    { optionGroups: pizzaOptions }
  ),
  item(
    'Specialty Pizza',
    'milanos-special-pizza',
    "Milano's Special Pizza",
    sizes(13.75, 19, 24),
    'Sausage, pepperoni, mushrooms, onions and green peppers. Anchovies upon request.',
    { optionGroups: pizzaOptions }
  ),
  item(
    'Specialty Pizza',
    'hawaiian-pizza',
    'Hawaiian Pizza',
    sizes(10.75, 16, 20),
    'Pineapple and ham.',
    { optionGroups: pizzaOptions }
  ),
  item(
    'Specialty Pizza',
    'white-heat-pizza',
    'White Heat Pizza',
    sizes(10.75, 16, 20),
    'Alfredo sauce, cheese and meatballs.',
    { optionGroups: pizzaOptions }
  ),
  item(
    'Specialty Pizza',
    'meat-lovers-pizza',
    'Meat Lovers Pizza',
    sizes(15, 20, 25),
    'Sausage, pepperoni, bacon and meatballs.',
    { optionGroups: pizzaOptions }
  ),

  item(
    'Hot Subs',
    'meatball-sub',
    'Meatball & Tomato Sauce Sub',
    9,
    'Homemade meatball and tomato sauce; no cheese.'
  ),
  item('Hot Subs', 'meatball-parm-sub', 'Meatball Parmigiana Sub', 10),
  item('Hot Subs', 'sloppy-sausage-parm-sub', 'Sloppy Sausage Parmigiana Sub', 10),
  item(
    'Hot Subs',
    'sausage-tomato-sauce-sub',
    'Sausage & Tomato Sauce Sub',
    9,
    'Sausage links with tomato sauce.'
  ),
  item(
    'Hot Subs',
    'italian-sausage-parm-sub',
    'Italian Sausage Parmigiana Sub',
    10.5,
    'Made with sausage links.'
  ),
  item('Hot Subs', 'hot-pressed-ham-cheese-sub', 'Hot Pressed Ham & Cheese Sub', 10),
  item('Hot Subs', 'eggplant-parm-sub', 'Eggplant Parmigiana Sub', 10),
  item('Hot Subs', 'chicken-parm-sub', 'Chicken Parmigiana Sub', 11),
  item('Hot Subs', 'chicken-cutlet-sub', 'Chicken Cutlet Sub', 10),
  item('Cold Subs', 'ham-cheese-sub', 'Ham & Cheese Sub', 9, 'With lettuce and tomato.'),
  item('Cold Subs', 'salami-cheese-sub', 'Salami & Cheese Sub', 9),
  item(
    'Cold Subs',
    'milanos-combo-sub',
    "Milano's Combo Sub",
    10,
    'Ham, capicola, salami, cheese, lettuce and tomato.'
  ),

  ...(
    [
      ['wings-with-fries', 'Regular Wings with Fries'],
      ['bbq-wings', 'BBQ Wings with Fries'],
      ['teriyaki-wings', 'Teriyaki Wings with Fries'],
      ['lemon-pepper-wings', 'Lemon Pepper Wings with Fries'],
      ['buffalo-wings', 'Buffalo Wings with Fries'],
    ] as const
  ).map(([slug, name]) =>
    item(
      'Wings',
      slug,
      name,
      portions(['6 wings', '12 wings', '18 wings'], [9.99, 17.99, 23.99]),
      'Includes fries.',
      {
        optionGroups: [{ label: 'Extra', choices: [{ label: 'Extra fries', price: 1.5 }] }],
      }
    )
  ),
  item(
    'Wings',
    'chicken-tenders-fries',
    'Chicken Tenders with Fries',
    8.99,
    'Six chicken tenders with fries.',
    {
      optionGroups: [
        choices('Sauce', ['Ranch', 'BBQ', 'Honey mustard', 'Blue cheese']),
        { label: 'Extra', choices: [{ label: 'Extra chicken tender', price: 1 }] },
      ],
    }
  ),

  item('Side Orders', 'side-tomato-sauce', 'Tomato Sauce', portions(['Side', 'Quart'], [2, 10])),
  ...[
    ['alfredo', 'Alfredo'],
    ['pink', 'Pink'],
    ['pesto', 'Pesto'],
    ['marinara', 'Marinara'],
  ].map(([slug, name]) =>
    item('Side Orders', `side-${slug}-sauce`, `${name} Sauce`, portions(['Side', 'Quart'], [2, 13]))
  ),
  item('Side Orders', 'side-meatballs', 'Side Meatballs', 5),
  item('Side Orders', 'side-sausage', 'Side Sausage Links', 5),
  item('Side Orders', 'side-baked-meatballs-mozzarella', 'Baked Meatballs with Mozzarella', 7),
  item('Side Orders', 'side-baked-sausage-mozzarella', 'Baked Sausage with Mozzarella', 7),
  item('Side Orders', 'side-dressing-garlic-oil', 'Side Dressing or Garlic Oil', 0.5, '', {
    optionGroups: [
      choices('Choice', [
        'Ranch',
        'Caesar',
        'Balsamic vinaigrette',
        'Red wine',
        'Creamy Italian',
        'Blue cheese',
        'Garlic oil',
      ]),
    ],
  }),
  item('Side Orders', 'side-ricotta', 'Side Ricotta', 4),
  item('Side Orders', 'side-pasta', 'Side of Pasta with Sauce', 4),
  item('Side Orders', 'side-broccoli', 'Broccoli', 4),
  item('Side Orders', 'side-mixed-vegetables', 'Mixed Vegetables', 4),
  item('Side Orders', 'side-peas', 'Peas', 2),
  item('Side Orders', 'burrata-ball', 'Burrata Ball', 6),
  item('Side Orders', 'fries', 'Fries', 3),
  item('Desserts', 'mini-cannoli', 'Mini Cannoli', 2),
  item('Desserts', 'large-cannoli', 'Large Cannoli', 4),
  item('Desserts', 'tiramisu', 'Tiramisu', 6),
  item('Desserts', 'cheesecake', 'Cheesecake', 6),
  item('Desserts', 'churros', 'Churros', 6, 'Four churros.'),

  ...(
    [
      ['lunch-soup-salad', 'Cup of Soup & Salad', 8.5],
      ['lunch-personal-pizza', 'Personal Pizza with One Topping', 9.5],
      ['lunch-chicken-caesar-salad', 'Chicken Caesar Salad', 9.5],
      ['lunch-burrata-cheese-salad', 'Burrata Cheese Salad', 10.5],
      ['lunch-gorgonzola-salad', 'Gorgonzola Salad', 10],
      ['lunch-baked-ziti', 'Baked Ziti', 8.5],
      ['lunch-pasta-any-sauce', 'Pasta with Any Sauce', 8.5],
      ['lunch-eggplant-parmigiana', 'Eggplant Parmigiana', 9],
      ['lunch-chicken-parmigiana', 'Chicken Parmigiana', 11],
      ['lunch-lasagna', 'Lasagna', 8.5],
      ['lunch-pasta-meatballs', 'Any Pasta with Meatballs', 11],
      ['lunch-meatball-parm-sub', 'Meatball Parm Sub', 9.5],
    ] as const
  ).map(([slug, name, price]) =>
    item('Lunch Menu', slug, name, price, 'Includes a drink and two garlic rolls.', {
      sourcePage: 1,
      optionGroups: [
        {
          label: 'Add a salad',
          choices: [
            { label: 'Mini House salad', price: 2 },
            { label: 'Mini Caesar salad', price: 2 },
          ],
        },
        ...(slug === 'lunch-baked-ziti'
          ? [
              {
                label: 'Baked ziti additions',
                choices: [
                  { label: 'Pink sauce', price: 1 },
                  { label: 'Ricotta', price: 2 },
                ],
              },
            ]
          : []),
      ],
    })
  ),

  ...(
    [
      ['lasagna', 'Lasagna', [65, 120]],
      ['baked-ziti', 'Baked Ziti', [65, 100, 125]],
      ['baked-ziti-ricotta', 'Baked Ziti with Ricotta', [70, 115, 135]],
      ['eggplant-parmigiana', 'Eggplant Parmigiana', [65, 125]],
      ['eggplant-rollatini', 'Eggplant Rollatini', [65, 125]],
      ['sausage-peppers', 'Sausage & Peppers', [70, 125]],
      ['chicken-parmigiana', 'Chicken Parmigiana', [65, 125]],
      ['chicken-francaise', 'Chicken Francaise', [65, 128]],
      ['chicken-marsala', 'Chicken Marsala', [65, 125]],
      ['grilled-chicken-strips', 'Grilled Chicken Strips', [65, 115]],
      ['penne-pink-sauce', 'Penne with Pink Sauce', [65, 100, 120]],
      ['penne-pink-sauce-vegetables', 'Penne with Pink Sauce & Peas or Broccoli', [70, 95, 124]],
      ['penne-pink-sauce-chicken', 'Penne with Pink Sauce & Grilled Chicken', [75, 100, 140]],
      ['penne-pink-sauce-shrimp', 'Penne with Pink Sauce & Shrimp', [80, 120, 150]],
    ] as const
  ).map(([slug, name, prices]) =>
    item(
      'Catering',
      `catering-${slug}`,
      `${name} Tray`,
      portions(
        ['Half tray (5-10)', 'Shallow tray (10-20)', 'Deep tray (30-40)'].slice(0, prices.length),
        [...prices]
      ),
      '',
      { sourcePage: 1 }
    )
  ),
  ...(
    [
      ['meatball-parm', 'Meatball Parmigiana', 65, 105],
      ['chicken-parm', 'Chicken Parmigiana', 70, 125],
      ['sloppy-sausage', 'Sloppy Sausage', 70, 125],
    ] as const
  ).map(([slug, name, small, large]) =>
    item(
      'Catering',
      `catering-${slug}-sliders`,
      `${name} Sliders`,
      portions(['20 sliders', '35 sliders'], [small, large]),
      '',
      { sourcePage: 1 }
    )
  ),
  item(
    'Catering',
    'catering-meatball-sausage',
    'Meatball or Sausage Side Tray',
    [{ label: 'Each', price: 2.5 }],
    'Priced per meatball or sausage.',
    { sourcePage: 1 }
  ),
  item(
    'Catering',
    'catering-rolls-tray',
    'Rolls Sold in Trays',
    [{ label: 'Tray charge', price: 3 }],
    'A $3.00 tray charge applies; rolls are priced separately.',
    { sourcePage: 1 }
  ),
  ...(
    [
      ['caesar', 'Caesar Salad', [28, 43, 54]],
      ['garden', 'Garden Salad', [28, 43, 54]],
      ['milanos', "Milano's Salad", [45, 75]],
      ['gorgonzola', 'Gorgonzola Salad', [45, 75]],
    ] as const
  ).map(([slug, name, prices]) =>
    item(
      'Catering',
      `catering-${slug}-salad`,
      `${name} Tray`,
      portions(['Half tray', 'Shallow tray', 'Deep tray'].slice(0, prices.length), [...prices]),
      '',
      { sourcePage: 1 }
    )
  ),
  item(
    'Catering',
    'catering-antipasto-platter',
    'Antipasto Salad Platter',
    portions(
      ['12-inch round (10-15)', '16-inch round (20-30)', '22-inch round (40-50)'],
      [60, 90, 150]
    ),
    '',
    { sourcePage: 1 }
  ),
  item(
    'Catering',
    'catering-mozzarella-tomato-basil-platter',
    'Fresh Tomato, Mozzarella & Basil Platter',
    portions(
      ['12-inch round (5-10)', '16-inch round (15-20)', '22-inch round (30-50)'],
      [45, 65, 110]
    ),
    'Fresh sliced tomato, mozzarella and basil.',
    { sourcePage: 1 }
  ),
  item(
    'Catering',
    'catering-ultimate-italian',
    'The Ultimate Italian',
    [{ label: 'Per person', price: 20 }],
    'Choose one entree, one pasta and one salad. Rolls and soda included.',
    {
      sourcePage: 1,
      notes: ['Minimum 10 people.'],
      optionGroups: [
        choices('Entree', [
          'Chicken Parmigiana',
          'Chicken Marsala',
          'Chicken Francaise',
          'Sausage & Peppers',
          'Eggplant Parmigiana',
          'Eggplant Rollatini',
        ]),
        choices('Pasta', [
          'Baked Ziti',
          'Bowtie Pink Sauce',
          'Pasta Marinara',
          'Pasta Tomato Sauce',
        ]),
        choices('Salad', [
          'Antipasto Salad',
          'Gorgonzola Salad',
          'Caesar Salad',
          'Garden Salad',
          'Mozzarella Tomato',
        ]),
      ],
    }
  ),
  item(
    'Catering',
    'catering-traditional-italian',
    'Traditional Italian',
    [{ label: 'Per person', price: 7.5 }],
    'Choose one pasta and one salad. Served with garlic rolls.',
    {
      sourcePage: 1,
      notes: ['Minimum 20 people.'],
      optionGroups: [
        choices('Pasta', [
          'Baked Ziti with Pink Sauce',
          'Bowties Marinara',
          'Bowties with Tomato Sauce',
        ]),
        choices('Salad', ['Garden Salad', 'Caesar Salad']),
      ],
    }
  ),
  item(
    'Catering',
    'catering-grilled-chicken-package',
    'Grilled Chicken Breast Cut in Strips',
    [{ label: 'Per person', price: 11 }],
    'Choose pasta, sauce, salad and rolls from the listed options.',
    {
      sourcePage: 1,
      notes: ['Minimum 20 people.'],
      optionGroups: [
        choices('Pasta', ['Spaghetti', 'Penne', 'Bowties']),
        choices('Sauce', ['Tomato', 'Marinara', 'Pink', 'Alfredo']),
        choices('Salad', ['Garden Salad', 'Caesar Salad']),
        choices('Rolls', ['Plain rolls', 'Garlic rolls']),
      ],
    }
  ),
  item(
    'Catering',
    'catering-deli-platter',
    'Deli Platter',
    [{ label: 'Per person', price: 12 }],
    'Ham, salami, capicola, turkey, provolone cheese and mozzarella cheese. Choose one bread and one salad.',
    {
      sourcePage: 1,
      notes: ['Minimum 15 people.', '48-hour notice required.'],
      optionGroups: [
        choices('Bread', [
          'World Famous Plain Rolls',
          'Focaccia Roll Sandwiches',
          'Kaiser Rolls',
          'Sub Rolls',
        ]),
        choices('Salad', ['Cold Pasta Salad', 'Antipasto Salad', 'Caesar Salad', 'Garden Salad']),
      ],
    }
  ),
  item(
    'Catering',
    'catering-pizza-garlic-rolls-combo',
    'Pizza & Garlic Rolls Combo',
    [{ label: 'Total', price: 180 }],
    'Ten large cheese pizzas and four dozen garlic rolls.',
    {
      sourcePage: 1,
      notes: ['Serves 40 people.'],
    }
  ),
];
