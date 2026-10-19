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
import Link from 'next/link';
import { MenuCatalog, MenuPrintNote } from '@/components/menu/MenuCatalog';

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
          <>
            <TrackedOrderLink className="button button-cream button-large" source={page.source}>
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
          <Link className="text-link menu-all-link" href="/menu#menu-navigation">← All menu categories</Link>
          {categoryItems.length > 0 ? (
            <>
              <MenuPrintNote />
              <MenuCatalog items={categoryItems} categories={page.categories} />
            </>
          ) : (
            <div className="category-content">
              <h2>Explore online ordering</h2>
              <p className="large-copy">View our current selection and availability in online ordering.</p>
            </div>
          )}
        </div>
      </section>

      <OrderCta source={`${page.source}-bottom`} />
    </>
  );
}
