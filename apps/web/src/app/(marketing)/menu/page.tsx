import Link from 'next/link';
import { menuItems, menuPages, type MenuCategory } from '@/content/menu';
import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { createPageMetadata } from '@/lib/seo/metadata';
import { MenuCatalog, menuCategoryAnchor, MenuPrintNote } from '@/components/menu/MenuCatalog';

export const metadata = createPageMetadata({
  title: "Milano's Menu | Pizza & Italian Favorites in Davie",
  description:
    "Browse Milano's Pizzas take-out menu, with pizza, pasta, garlic rolls, subs, wings, salads, desserts, lunch, and catering in Davie.",
  path: '/menu',
});

export default function MenuPage() {
  const categories = Array.from(new Set<MenuCategory>([
    ...menuPages.flatMap((page) => page.categories),
    'Catering',
  ])).filter((category) => menuItems.some((item) => item.category === category && item.available));

  return (
    <>
      <PageHero
        eyebrow="Pizza and Italian-American favorites"
        title="The Milano's Pizzas Menu"
        intro="From garlic rolls to a pizza for the whole table. Browse our take-out menu, find your favorites, and order online."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Menu', href: '/menu' }]}
        actions={
          <>
            <TrackedOrderLink className="button button-cream button-large" source="menu-landing">
              Order Online
            </TrackedOrderLink>
            <a className="button button-outline-light button-large" href="/menus/Milanos_Takeout_Menu.pdf" download>
              Download Menu (PDF)
            </a>
          </>
        }
        compact
      />

      <section className="content-section full-menu-section">
        <div className="site-container">
          <nav id="menu-navigation" className="menu-category-navigation" aria-label="Menu categories">
            <p className="eyebrow">Find your next favorite</p>
            <h2>Browse the menu</h2>
            <ul>
              {categories.map((category) => (
                <li key={category}><a href={`#${menuCategoryAnchor(category)}`}>{category}</a></li>
              ))}
            </ul>
          </nav>
          <MenuPrintNote />
          <MenuCatalog items={menuItems} categories={categories} pageLinks={menuPages} />
          <div className="menu-help-links">
            <p>Planning a gathering? <Link className="text-link" href="/catering">Explore catering and request a quote.</Link></p>
            {menuPages.filter((page) => !page.categories.some((category) => categories.includes(category))).map((page) => (
              <p key={page.slug}><Link className="text-link" href={`/menu/${page.slug}`}>{page.label}</Link></p>
            ))}
          </div>
        </div>
      </section>

      <OrderCta source="menu-landing-bottom" />
    </>
  );
}
