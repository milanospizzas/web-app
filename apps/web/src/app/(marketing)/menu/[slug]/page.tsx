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
        intro={page.slug === 'lunch-specials'
          ? 'Explore our lunch menu in online ordering for the latest selection and availability.'
          : page.intro}
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
          <h2>{categoryItems.length > 0 ? 'From our menu' : 'Explore online ordering'}</h2>
          <p className="large-copy">
            {categoryItems.length > 0
              ? 'Browse a few dishes from this category. Continue to online ordering for the latest selection and availability.'
              : "We’re updating this section of our website. View our current menu in online ordering."}
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
                      Order Online <span aria-hidden="true">→</span>
                    </TrackedOrderLink>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <OrderCta source={`${page.source}-bottom`} />
    </>
  );
}
