export type MenuCategory =
  | 'Pizza'
  | 'Specialty Pizza'
  | 'Appetizers'
  | 'Soups'
  | 'Salads'
  | 'Wings'
  | 'Side Orders'
  | 'Hot Subs'
  | 'Cold Subs'
  | 'Pasta'
  | 'Ravioli'
  | 'Baked Dishes'
  | 'Meat Dishes'
  | 'Chicken Dishes'
  | 'Kids Menu'
  | 'Desserts'
  | 'Beverages'
  | 'Lunch Menu'
  | 'Catering';

export interface MenuItemImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface MenuItem {
  name: string;
  slug: string;
  category: MenuCategory;
  shortDescription: string;
  fullDescription: string;
  image: MenuItemImage | null;
  dietaryIndicators: string[];
  featured: boolean;
  available: boolean;
  displayedPrice: number | null;
  externalItemReference: string | null;
  seoTitle: string;
  seoDescription: string;
}

export interface MenuPageDefinition {
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  categories: MenuCategory[];
  source: string;
}

export const menuPages: MenuPageDefinition[] = [
  {
    slug: 'pizza',
    label: 'Pizza',
    h1: 'Pizza Menu',
    title: 'Pizza Menu in Davie, FL',
    description:
      "Explore thin-crust pizza from Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro:
      "Thin-crust pizza is at the heart of Milano's menu. Visit our ordering storefront for the current selection and available options.",
    categories: ['Pizza'],
    source: 'menu-pizza',
  },
  {
    slug: 'specialty-pizza',
    label: 'Specialty Pizza',
    h1: 'Specialty Pizza Menu',
    title: "Specialty Pizza Menu in Davie, FL",
    description:
      "Explore the specialty pizza category at Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro:
      "Explore Milano's specialty pizza category, then check online ordering for the selection currently offered.",
    categories: ['Specialty Pizza'],
    source: 'menu-specialty-pizza',
  },
  {
    slug: 'wings-appetizers',
    label: 'Wings & Appetizers',
    h1: 'Wings & Appetizers Menu',
    title: "Wings & Appetizers Menu in Davie",
    description:
      "Explore appetizers, garlic rolls, and wings from Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro:
      "Start the table with appetizers, Milano's popular garlic rolls, or wings. Current choices are shown in online ordering.",
    categories: ['Appetizers', 'Wings'],
    source: 'menu-wings-appetizers',
  },
  {
    slug: 'soups',
    label: 'Soups',
    h1: 'Soups Menu',
    title: "Soups Menu in Davie, FL",
    description:
      "Explore the soups category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: "Browse Milano's soups category, with the current selection maintained in online ordering.",
    categories: ['Soups'],
    source: 'menu-soups',
  },
  {
    slug: 'salads',
    label: 'Salads',
    h1: 'Salads Menu',
    title: "Salads Menu in Davie, FL",
    description:
      "Explore the salads category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: "Find Milano's salad category here, then see the current choices in online ordering.",
    categories: ['Salads'],
    source: 'menu-salads',
  },
  {
    slug: 'side-orders',
    label: 'Side Orders',
    h1: 'Side Orders Menu',
    title: "Side Orders Menu in Davie",
    description:
      "Explore side orders from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: "Round out your meal with Milano's side-orders category. Current choices appear in online ordering.",
    categories: ['Side Orders'],
    source: 'menu-side-orders',
  },
  {
    slug: 'subs',
    label: 'Hot & Cold Subs',
    h1: 'Hot & Cold Subs Menu',
    title: "Hot & Cold Subs Menu in Davie",
    description:
      "Explore hot and cold subs from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro:
      "Milano's menu includes both hot and cold sub categories. See online ordering for today's complete selection.",
    categories: ['Hot Subs', 'Cold Subs'],
    source: 'menu-subs',
  },
  {
    slug: 'pasta',
    label: 'Pasta',
    h1: 'Pasta Menu',
    title: "Pasta Menu in Davie, FL",
    description:
      "Explore pasta from Milano's Pizzas in Davie, Florida, then continue to online ordering for current item availability.",
    intro: "Explore Milano's pasta category and continue to online ordering for the current selection.",
    categories: ['Pasta'],
    source: 'menu-pasta',
  },
  {
    slug: 'ravioli',
    label: 'Ravioli',
    h1: 'Ravioli Menu',
    title: "Ravioli Menu in Davie, FL",
    description:
      "Explore the ravioli category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: "Browse Milano's ravioli category, with current choices listed in online ordering.",
    categories: ['Ravioli'],
    source: 'menu-ravioli',
  },
  {
    slug: 'baked-dishes',
    label: 'Baked Dishes',
    h1: 'Baked Dishes Menu',
    title: "Baked Dishes Menu in Davie",
    description:
      "Explore baked dishes from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: "Find comforting baked-dish favorites at Milano's, with current availability in online ordering.",
    categories: ['Baked Dishes'],
    source: 'menu-baked-dishes',
  },
  {
    slug: 'meat-dishes',
    label: 'Meat Dishes',
    h1: 'Meat Dishes Menu',
    title: "Meat Dishes Menu in Davie",
    description:
      "Explore the meat dishes category at Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro: "Explore Milano's meat-dishes category, then see current choices in online ordering.",
    categories: ['Meat Dishes'],
    source: 'menu-meat-dishes',
  },
  {
    slug: 'chicken-dishes',
    label: 'Chicken Dishes',
    h1: 'Chicken Dishes Menu',
    title: "Chicken Dishes Menu in Davie",
    description:
      "Explore chicken dishes from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: "Browse Milano's chicken-dishes category and continue online for current availability.",
    categories: ['Chicken Dishes'],
    source: 'menu-chicken-dishes',
  },
  {
    slug: 'kids-menu',
    label: 'Kids Menu',
    h1: 'Kids Menu',
    title: "Kids Menu in Davie, FL",
    description:
      "Explore the kids menu category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: "Explore the kids-menu category, with current choices maintained in online ordering.",
    categories: ['Kids Menu'],
    source: 'menu-kids',
  },
  {
    slug: 'desserts',
    label: 'Desserts',
    h1: 'Desserts Menu',
    title: "Desserts Menu in Davie, FL",
    description:
      "Explore desserts from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: "Finish with the Milano's desserts category and see current options in online ordering.",
    categories: ['Desserts'],
    source: 'menu-desserts',
  },
  {
    slug: 'beverages',
    label: 'Beverages',
    h1: 'Beverages Menu',
    title: "Beverages Menu in Davie, FL",
    description:
      "Explore the beverages category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: "Browse the beverages category and check online ordering for current choices and sizes.",
    categories: ['Beverages'],
    source: 'menu-beverages',
  },
  {
    slug: 'lunch-specials',
    label: 'Lunch Menu',
    h1: 'Lunch Menu',
    title: "Lunch Menu in Davie, FL",
    description:
      "Explore Milano's lunch menu category in Davie, Florida, then continue to online ordering for current availability.",
    intro:
      "Explore Milano's lunch-menu category. No promotional offers or prices are published here while specials await verification.",
    categories: ['Lunch Menu'],
    source: 'menu-lunch',
  },
];

const approvedFeaturedItems: Omit<MenuItem, 'image' | 'displayedPrice' | 'externalItemReference'>[] = [
  {
    name: 'Cheese Pizza',
    slug: 'cheese-pizza',
    category: 'Pizza',
    shortDescription: "A classic selection from Milano's pizza menu.",
    fullDescription: "Cheese Pizza is part of Milano's pizza menu. Visit online ordering for current sizes and options.",
    dietaryIndicators: [],
    featured: true,
    available: true,
    seoTitle: "Cheese Pizza at Milano's Pizzas",
    seoDescription: "Find Cheese Pizza in the Milano's Pizzas online ordering menu when currently available.",
  },
  {
    name: "Milano's Special Pizza",
    slug: 'milanos-special-pizza',
    category: 'Specialty Pizza',
    shortDescription: "A named selection from Milano's specialty-pizza category.",
    fullDescription: "Milano's Special Pizza is part of the specialty-pizza menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Milano's Special Pizza",
    seoDescription: "Find Milano's Special Pizza in online ordering when currently available.",
  },
  {
    name: 'Meat Lovers Pizza', slug: 'meat-lovers-pizza', category: 'Specialty Pizza',
    shortDescription: "A specialty-pizza selection from Milano's menu.",
    fullDescription: "Meat Lovers Pizza is part of Milano's specialty-pizza menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Meat Lovers Pizza at Milano's", seoDescription: "Find Meat Lovers Pizza in online ordering when currently available.",
  },
  {
    name: 'Margherita Pizza', slug: 'margherita-pizza', category: 'Specialty Pizza',
    shortDescription: "A specialty-pizza selection from Milano's menu.",
    fullDescription: "Margherita Pizza is part of Milano's specialty-pizza menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Margherita Pizza at Milano's", seoDescription: "Find Margherita Pizza in online ordering when currently available.",
  },
  {
    name: 'Garlic Rolls', slug: 'garlic-rolls', category: 'Appetizers',
    shortDescription: "Milano's popular garlic rolls.",
    fullDescription: "Garlic Rolls are part of Milano's appetizer menu. Current order options are maintained online.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Garlic Rolls at Milano's Pizzas", seoDescription: "Find Milano's popular Garlic Rolls in online ordering when currently available.",
  },
  {
    name: 'Chicken Parmigiana', slug: 'chicken-parmigiana', category: 'Chicken Dishes',
    shortDescription: "An Italian-American favorite from Milano's chicken-dishes category.",
    fullDescription: "Chicken Parmigiana is part of Milano's chicken-dishes menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Chicken Parmigiana at Milano's", seoDescription: "Find Chicken Parmigiana in online ordering when currently available.",
  },
  {
    name: 'Baked Ziti', slug: 'baked-ziti', category: 'Baked Dishes',
    shortDescription: "An Italian-American favorite from Milano's baked-dishes category.",
    fullDescription: "Baked Ziti is part of Milano's baked-dishes menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Baked Ziti at Milano's Pizzas", seoDescription: "Find Baked Ziti in online ordering when currently available.",
  },
  {
    name: 'Lasagna', slug: 'lasagna', category: 'Baked Dishes',
    shortDescription: "An Italian-American favorite from Milano's baked-dishes category.",
    fullDescription: "Lasagna is part of Milano's baked-dishes menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Lasagna at Milano's Pizzas", seoDescription: "Find Lasagna in online ordering when currently available.",
  },
  {
    name: 'Wings with Fries', slug: 'wings-with-fries', category: 'Wings',
    shortDescription: "A selection from Milano's wings category.",
    fullDescription: "Wings with Fries are part of Milano's wings menu. Current details are maintained in online ordering.",
    dietaryIndicators: [], featured: true, available: true,
    seoTitle: "Wings with Fries at Milano's", seoDescription: "Find Wings with Fries in online ordering when currently available.",
  },
];

export const menuItems: MenuItem[] = approvedFeaturedItems.map((item) => ({
  ...item,
  image: null,
  displayedPrice: null,
  externalItemReference: null,
}));

export function getMenuPage(slug: string) {
  return menuPages.find((page) => page.slug === slug);
}

export function getPublishedMenuItems(page: MenuPageDefinition) {
  return menuItems.filter(
    (item) => page.categories.includes(item.category) && item.available,
  );
}

export function menuPageHasPublishedItems(page: MenuPageDefinition) {
  return getPublishedMenuItems(page).length > 0;
}
