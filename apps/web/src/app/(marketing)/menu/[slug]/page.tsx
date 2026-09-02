import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getMenuPage,
  getPublishedMenuItems,
  menuPageHasPublishedItems,
  menuPages,
} from '@/content/menu';
import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { createPageMetadata } from '@/lib/seo/metadata';

interface MenuCategoryPageProps {
  params: { slug: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return menuPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: MenuCategoryPageProps): Metadata {
  const page = getMenuPage(params.slug);
  if (!page) return {};

  return createPageMetadata({
    title: page.title,
    description: page.description,
    path: `/menu/${page.slug}`,
    noIndex: !menuPageHasPublishedItems(page),
  });
}

export default function MenuCategoryPage({ params }: MenuCategoryPageProps) {
  const page = getMenuPage(params.slug);
  if (!page) notFound();

  const categoryItems = getPublishedMenuItems(page);

  return (
    <>
      <PageHero
        eyebrow="Milano's menu"
        title={page.h1}
        intro={page.intro}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Menu', href: '/menu' },
          { label: page.label, href: `/menu/${page.slug}` },
        ]}
        actions={
          <TrackedOrderLink className="button button-cream button-large" source={page.source}>
            Order Online
          </TrackedOrderLink>
        }
      />

      <section className="content-section category-content">
        <div className="site-container narrow-container">
          <p className="eyebrow">Browse this category</p>
          <h2>{page.categories.join(' & ')}</h2>
          <p className="large-copy">
            This first-party page introduces the {page.label.toLowerCase()} category without
            publishing unverified prices. Use online ordering to see the current item selection,
            options, and availability.
          </p>

          {categoryItems.length > 0 && (
            <div className="approved-item-grid">
              {categoryItems.map((item) => (
                <article
                  key={item.slug}
                  className={item.image ? 'approved-item-card' : 'approved-item-card text-only'}
                >
                  {item.image && (
                    <img
                      src={item.image.src}
                      alt={item.image.alt}
                      width={item.image.width}
                      height={item.image.height}
                      loading="lazy"
                    />
                  )}
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.shortDescription}</p>
                    <TrackedOrderLink source={`featured-${item.slug}`} menuItem>
                      Order this item <span aria-hidden="true">→</span>
                    </TrackedOrderLink>
                  </div>
                </article>
              ))}
            </div>
          )}

          {categoryItems.length === 0 && (
            <div className="price-note">
              <strong>Verified item details are coming later.</strong>
              <p>
                This category route remains available for visitors, but it stays out of search
                results until Milano's has approved first-party item content for publication.
              </p>
            </div>
          )}

          <div className="price-note">
            <strong>About website pricing</strong>
            <p>
              No prices are published on this website until they have been checked against the
              current POS menu. Online ordering is the source for current selections.
            </p>
          </div>
        </div>
      </section>

      <OrderCta source={`${page.source}-bottom`} />
    </>
  );
}
