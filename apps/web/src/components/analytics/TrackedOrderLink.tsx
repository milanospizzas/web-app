'use client';

import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics/events';
import { CAMPAIGN_KEYS, safeCampaignValue } from '@/lib/order/tracking';

interface TrackedOrderLinkProps {
  source: string;
  children: ReactNode;
  className?: string;
  menuItem?: boolean;
  ariaLabel?: string;
}

export function TrackedOrderLink({
  source,
  children,
  className,
  menuItem = false,
  ariaLabel,
}: TrackedOrderLinkProps) {
  const baseHref = `/order?source=${encodeURIComponent(source)}`;

  function destinationWithCurrentCampaign() {
    const destination = new URL(baseHref, window.location.origin);
    const current = new URL(window.location.href);

    for (const key of CAMPAIGN_KEYS) {
      const value = safeCampaignValue(current.searchParams.get(key));
      if (value) destination.searchParams.set(key, value);
    }

    return `${destination.pathname}${destination.search}`;
  }

  function preserveCampaign(event: PointerEvent<HTMLAnchorElement>) {
    event.currentTarget.href = destinationWithCurrentCampaign();
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.href = destinationWithCurrentCampaign();
    trackEvent('order_button_clicked', { source });
    if (menuItem) trackEvent('menu_item_order_clicked', { source });
  }

  return (
    <a
      href={baseHref}
      className={className}
      onPointerDown={preserveCampaign}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
