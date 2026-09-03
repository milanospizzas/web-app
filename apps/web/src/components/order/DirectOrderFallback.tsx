'use client';

import type { OrderProvider } from '@/lib/order/config';
import { trackEvent } from '@/lib/analytics/events';

export function DirectOrderFallback({
  destination,
  provider,
  source,
}: {
  destination: string;
  provider: OrderProvider;
  source: string;
}) {
  function trackRedirect() {
    if (provider === 'skytab') {
      trackEvent('skytab_redirect_clicked', {
        source,
        provider,
      });
    }
  }

  return (
    <p className="order-fallback">
      Having trouble?{' '}
      <a className="text-link" href={destination} onClick={trackRedirect}>
        Open SkyTab ordering directly
      </a>
      .
    </p>
  );
}
