'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OrderProvider } from '@/lib/order/config';
import { normalizeAnalyticsValue, trackEvent } from '@/lib/analytics/events';

export function OrderPageViewTracker({ provider }: { provider: OrderProvider }) {
  const searchParams = useSearchParams();
  const tracked = useRef(false);
  const source = normalizeAnalyticsValue(searchParams.get('source'));

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent('order_page_viewed', { source, provider });
  }, [provider, source]);

  return null;
}
