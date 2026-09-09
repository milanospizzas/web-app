import Link from 'next/link';
import { menuPages } from '@/content/menu';
import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Milano's Menu | Pizza & Italian Favorites in Davie",
  description:
    "Explore Milano's Pizzas menu categories, including pizza, pasta, subs, wings, salads, baked dishes, desserts, lunch, and more in Davie.",
  path: '/menu',
});

export default function MenuPage() {
  return (
    <>
      <PageHero
        eyebrow="Pizza and Italian-American favorites"
        title="Explore the Milano's Pizzas Menu"
        intro="Explore our menu categories, then continue to online ordering for the latest selection and availability."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Menu', href: '/menu' }]}
        actions={
          <TrackedOrderLink className="button button-cream button-large" source="menu-landing">
            Order Online
          </TrackedOrderLink>
        }
      />

      <section className="content-section menu-directory-section">
        <div className="site-container">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Find your next favorite</p>
              <h2>Menu categories</h2>
            </div>
          </div>
          <div className="menu-directory-grid">
            {menuPages.map((page, index) => (
              <Link className="menu-directory-card" href={`/menu/${page.slug}`} key={page.slug}>
                <span className="menu-card-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{page.label}</h3>
                <p>{page.slug === 'lunch-specials'
                  ? 'Explore our lunch menu in online ordering for the latest selection and availability.'
                  : page.intro}</p>
                <span className="menu-card-link">Explore category <span aria-hidden="true">→</span></span>
              </Link>
            ))}
            <Link className="menu-directory-card catering-card" href="/catering">
              <span className="menu-card-number" aria-hidden="true">{String(menuPages.length + 1).padStart(2, '0')}</span>
              <h3>Catering</h3>
              <p>Explore general catering categories and request a quote directly from Milano's.</p>
              <span className="menu-card-link">Explore catering <span aria-hidden="true">→</span></span>
            </Link>
          </div>
        </div>
      </section>

      <OrderCta source="menu-landing-bottom" />
    </>
  );
}
