import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderExperience } from '@/components/order/OrderExperience';
import { getPublicOrderConfig } from '@/lib/order/config';
import { createPageMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { site } from '@/content/site';
import { OrderPageViewTracker } from '@/components/analytics/OrderPageViewTracker';

export const metadata: Metadata = createPageMetadata({
  title: "Order Online | Milano's Pizzas in Davie, FL",
  description:
    "Leave Milano's Pizzas website and continue to SkyTab to view the current menu and place your order.",
  path: '/order',
});

export default function OrderPage() {
  const config = getPublicOrderConfig();

  return (
    <section className="order-page">
      <div className="order-page-glow" aria-hidden="true" />
      <div className="site-container order-page-inner">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Order Online', href: '/order' },
          ]}
        />
        <div className="order-panel">
          <p className="eyebrow">Order directly from Milano's</p>
          <h1>Order Milano's Pizzas Online</h1>
          <p>
            You’ll leave Milano’s website and continue to SkyTab, our online ordering provider, to
            view the current menu and place your order.
          </p>
          <Suspense fallback={null}>
            <OrderPageViewTracker provider={config.provider} />
          </Suspense>
          {config.checkoutUrl ? (
            <Suspense fallback={<p className="order-status">Preparing SkyTab ordering…</p>}>
              <OrderExperience config={config} />
            </Suspense>
          ) : (
            <div className="order-dynamic" role="alert">
              <p className="order-error">
                <strong>Online ordering is temporarily unavailable.</strong>
              </p>
              <p>
                Please call us at{' '}
                <a className="text-link" href={site.phoneHref}>
                  {site.phoneDisplay}
                </a>{' '}
                and we will be glad to help.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
