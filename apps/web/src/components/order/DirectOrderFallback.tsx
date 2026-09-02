'use client';

import type { MouseEvent, PointerEvent } from 'react';
import type { OrderProvider } from '@/lib/order/config';
import { normalizeAnalyticsValue, trackEvent } from '@/lib/analytics/events';
import { checkoutDestinationWithTracking } from '@/lib/order/tracking';

export function DirectOrderFallback({
  checkoutUrl,
  provider,
}: {
  checkoutUrl: string;
  provider: OrderProvider;
}) {
  function destinationWithTracking() {
    const current = new URL(window.location.href);
    return checkoutDestinationWithTracking(checkoutUrl, current.searchParams);
  }

  function prepareFallback(event: PointerEvent<HTMLAnchorElement>) {
    event.currentTarget.href = destinationWithTracking();
  }

  function preserveTracking(event: MouseEvent<HTMLAnchorElement>) {
    const current = new URL(window.location.href);
    event.currentTarget.href = destinationWithTracking();
    if (provider === 'skytab') {
      trackEvent('skytab_redirect_clicked', {
        source: normalizeAnalyticsValue(current.searchParams.get('source')),
        provider,
      });
    }
  }

  return (
    <p className="order-fallback">
      Having trouble?{' '}
      <a
        className="text-link"
        href={checkoutUrl}
        onPointerDown={prepareFallback}
        onClick={preserveTracking}
        aria-label="Open Milano's online ordering storefront directly"
      >
        Open online ordering directly
      </a>
      .
    </p>
  );
}
