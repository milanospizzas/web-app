import { menuCatalog } from './menu-catalog';
export { menuCategoryNotes } from './menu-catalog';

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
  generated?: boolean;
}

export interface MenuPriceOption {
  label: string;
  price: number;
}

export interface MenuOptionGroup {
  label: string;
  choices: { label: string; price?: number }[];
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
  priceOptions?: MenuPriceOption[];
  optionGroups?: MenuOptionGroup[];
  notes?: string[];
  sourcePage?: 1 | 2;
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
    intro: 'Build your pizza with three sizes, classic toppings and your choice of extras.',
    categories: ['Pizza'],
    source: 'menu-pizza',
  },
  {
    slug: 'specialty-pizza',
    label: 'Specialty Pizza',
    h1: 'Specialty Pizza Menu',
    title: 'Specialty Pizza Menu in Davie, FL',
    description:
      "Explore the specialty pizza category at Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro: "Explore six signature pizzas, from Margherita to Milano's Special and Meat Lovers.",
    categories: ['Specialty Pizza'],
    source: 'menu-specialty-pizza',
  },
  {
    slug: 'wings-appetizers',
    label: 'Wings & Appetizers',
    h1: 'Wings & Appetizers Menu',
    title: 'Wings & Appetizers Menu in Davie',
    description:
      "Explore appetizers, garlic rolls, and wings from Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro:
      'Start with garlic rolls, signature sliders and baked appetizers, or choose wings and tenders with fries.',
    categories: ['Appetizers', 'Wings'],
    source: 'menu-wings-appetizers',
  },
  {
    slug: 'soups',
    label: 'Soups',
    h1: 'Soups Menu',
    title: 'Soups Menu in Davie, FL',
    description:
      "Explore the soups category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: 'Pasta Fagioli and Minestrone are available by the cup, bowl or quart.',
    categories: ['Soups'],
    source: 'menu-soups',
  },
  {
    slug: 'salads',
    label: 'Salads',
    h1: 'Salads Menu',
    title: 'Salads Menu in Davie, FL',
    description:
      "Explore the salads category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: 'Choose from seven salads, with dressings and optional chicken, shrimp or broccoli.',
    categories: ['Salads'],
    source: 'menu-salads',
  },
  {
    slug: 'side-orders',
    label: 'Side Orders',
    h1: 'Side Orders Menu',
    title: 'Side Orders Menu in Davie',
    description:
      "Explore side orders from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: 'Complete your meal with sauces, meatballs, sausage, vegetables and more.',
    categories: ['Side Orders'],
    source: 'menu-side-orders',
  },
  {
    slug: 'subs',
    label: 'Hot & Cold Subs',
    h1: 'Hot & Cold Subs Menu',
    title: 'Hot & Cold Subs Menu in Davie',
    description:
      "Explore hot and cold subs from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: "Explore hot Italian favorites and cold subs, including Milano's Combo.",
    categories: ['Hot Subs', 'Cold Subs'],
    source: 'menu-subs',
  },
  {
    slug: 'pasta',
    label: 'Pasta',
    h1: 'Pasta Menu',
    title: 'Pasta Menu in Davie, FL',
    description:
      "Explore pasta from Milano's Pizzas in Davie, Florida, then continue to online ordering for current item availability.",
    intro:
      'Choose spaghetti, penne, bowties or fettuccini with your favorite sauce, plus optional additions.',
    categories: ['Pasta'],
    source: 'menu-pasta',
  },
  {
    slug: 'ravioli',
    label: 'Ravioli',
    h1: 'Ravioli Menu',
    title: 'Ravioli Menu in Davie, FL',
    description:
      "Explore the ravioli category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro:
      'Choose cheese, short rib or wild mushroom ravioli, with the option to bake it with mozzarella.',
    categories: ['Ravioli'],
    source: 'menu-ravioli',
  },
  {
    slug: 'baked-dishes',
    label: 'Baked Dishes',
    h1: 'Baked Dishes Menu',
    title: 'Baked Dishes Menu in Davie',
    description:
      "Explore baked dishes from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: 'Explore lasagna, baked ziti and eggplant dishes, with extra cheese and sauce options.',
    categories: ['Baked Dishes'],
    source: 'menu-baked-dishes',
  },
  {
    slug: 'meat-dishes',
    label: 'Meat Dishes',
    h1: 'Meat Dishes Menu',
    title: 'Meat Dishes Menu in Davie',
    description:
      "Explore the meat dishes category at Milano's Pizzas in Davie, then continue to online ordering for current availability.",
    intro: 'Choose sausage and peppers or beef brisket with mushroom risotto.',
    categories: ['Meat Dishes'],
    source: 'menu-meat-dishes',
  },
  {
    slug: 'chicken-dishes',
    label: 'Chicken Dishes',
    h1: 'Chicken Dishes Menu',
    title: 'Chicken Dishes Menu in Davie',
    description:
      "Explore chicken dishes from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro:
      'Explore chicken Parmigiana, cutlet, Marsala, Francaise, and grilled chicken with broccoli.',
    categories: ['Chicken Dishes'],
    source: 'menu-chicken-dishes',
  },
  {
    slug: 'kids-menu',
    label: 'Kids Menu',
    h1: 'Kids Menu',
    title: 'Kids Menu in Davie, FL',
    description:
      "Explore the kids menu category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: 'Pasta, baked ziti, pizza and ravioli for smaller appetites.',
    categories: ['Kids Menu'],
    source: 'menu-kids',
  },
  {
    slug: 'desserts',
    label: 'Desserts',
    h1: 'Desserts Menu',
    title: 'Desserts Menu in Davie, FL',
    description:
      "Explore desserts from Milano's Pizzas in Davie, Florida, then continue to online ordering for current availability.",
    intro: 'Finish your meal with cannoli, tiramisu, cheesecake or churros.',
    categories: ['Desserts'],
    source: 'menu-desserts',
  },
  {
    slug: 'beverages',
    label: 'Beverages',
    h1: 'Beverages Menu',
    title: 'Beverages Menu in Davie, FL',
    description:
      "Explore the beverages category at Milano's Pizzas in Davie, Florida, and continue to online ordering for current availability.",
    intro: 'Browse the beverages category and check online ordering for current choices and sizes.',
    categories: ['Beverages'],
    source: 'menu-beverages',
  },
  {
    slug: 'lunch-specials',
    label: 'Lunch Menu',
    h1: 'Lunch Menu',
    title: 'Lunch Menu in Davie, FL',
    description:
      "Explore Milano's lunch menu category in Davie, Florida, then continue to online ordering for current availability.",
    intro:
      'Lunch is served Monday through Friday, 11 AM to 3 PM, with a drink and two garlic rolls included.',
    categories: ['Lunch Menu'],
    source: 'menu-lunch',
  },
];

const featuredSlugs = new Set([
  'cheese-pizza',
  'milanos-special-pizza',
  'meat-lovers-pizza',
  'margherita-pizza',
  'garlic-rolls',
  'chicken-parmigiana',
  'baked-ziti',
  'lasagna',
  'wings-with-fries',
]);

export const menuItems: MenuItem[] = menuCatalog.map((item) => ({
  ...item,
  fullDescription: item.shortDescription || item.name,
  image:
    item.slug === 'garlic-rolls'
      ? {
          src: '/images/menu/garlic-rolls.webp',
          alt: 'AI-generated illustration of six golden garlic rolls on a white Milano’s Pizzas plate',
          width: 1536,
          height: 1024,
          generated: true,
        }
      : null,
  dietaryIndicators: [],
  featured: featuredSlugs.has(item.slug),
  available: true,
  displayedPrice: item.displayedPrice ?? null,
  externalItemReference: null,
  seoTitle: `${item.name} at Milano's Pizzas`,
  seoDescription: item.shortDescription || `Explore ${item.name} on Milano's Pizzas take-out menu.`,
}));

export function getMenuPage(slug: string) {
  return menuPages.find((page) => page.slug === slug);
}

export function getPublishedMenuItems(page: MenuPageDefinition) {
  return menuItems.filter((item) => page.categories.includes(item.category) && item.available);
}

export function menuPageHasPublishedItems(page: MenuPageDefinition) {
  return getPublishedMenuItems(page).length > 0;
}
