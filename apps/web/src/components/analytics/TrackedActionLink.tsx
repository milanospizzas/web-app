'use client';

import type { AnalyticsEventName } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics/events';
import type { ReactNode } from 'react';

interface TrackedActionLinkProps {
  eventName: Extract<AnalyticsEventName, 'phone_call_clicked' | 'directions_clicked'>;
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  target?: '_blank';
  rel?: string;
  location: string;
}

export function TrackedActionLink({
  eventName,
  href,
  children,
  className,
  ariaLabel,
  target,
  rel,
  location,
}: TrackedActionLinkProps) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      target={target}
      rel={rel}
      onClick={() => trackEvent(eventName, { link_location: location })}
    >
      {children}
    </a>
  );
}
