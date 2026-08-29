'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PublicOrderConfig } from '@/lib/order/config';
import { normalizeAnalyticsValue, trackEvent } from '@/lib/analytics/events';
import { checkoutDestinationWithTracking } from '@/lib/order/tracking';
import { site } from '@/content/site';

export function OrderExperience({ config }: { config: PublicOrderConfig }) {
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const source = normalizeAnalyticsValue(searchParams.get('source'));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const destination = useMemo(() => {
    if (!config.checkoutUrl) return null;
    return checkoutDestinationWithTracking(config.checkoutUrl, searchParams);
  }, [config.checkoutUrl, searchParams]);

  const canUseFrame = Boolean(
    destination && config.mode === 'iframe' && config.iframeEnabled && !isMobile,
  );

  useEffect(() => {
    if (!showFrame || frameLoaded) return;
    const timeout = window.setTimeout(() => setFrameFailed(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [frameLoaded, showFrame]);

  function beginOrder() {
    if (!destination) return;

    if (canUseFrame) {
      if (config.provider === 'skytab') {
        trackEvent('skytab_iframe_attempted', { source, provider: config.provider });
      }
      setFrameFailed(false);
      setFrameLoaded(false);
      setShowFrame(true);
      return;
    }

    if (config.provider === 'skytab') {
      trackEvent('skytab_redirect_clicked', { source, provider: config.provider });
    }
    setIsLeaving(true);
    window.setTimeout(() => window.location.assign(destination), 200);
  }

  if (!destination) {
    return (
      <div className="order-dynamic" role="alert">
        <p className="order-error"><strong>Online ordering is temporarily unavailable.</strong></p>
        <p>
          Please call us at{' '}
          <a className="text-link" href={site.phoneHref}>
            {site.phoneDisplay}
          </a>{' '}
          and we will be glad to help.
        </p>
      </div>
    );
  }

  return (
    <div className="order-dynamic">
      {showFrame && !frameFailed ? (
        <div className="order-frame-shell" aria-live="polite">
          {!frameLoaded && <p className="order-status">Loading online ordering…</p>}
          <iframe
            className="order-frame"
            src={destination}
            title="Milano's Pizzas online ordering storefront"
            onLoad={() => {
              setFrameLoaded(true);
              setFrameFailed(false);
            }}
            onError={() => setFrameFailed(true)}
          />
        </div>
      ) : (
        <button
          className="button button-primary button-large"
          type="button"
          onClick={beginOrder}
          disabled={isLeaving}
          aria-label="Continue to Milano's secure online ordering storefront"
        >
          {isLeaving ? 'Opening secure ordering…' : 'Continue to Order'}
        </button>
      )}

      {frameFailed && (
        <p className="order-error" role="alert">
          The embedded ordering storefront did not load. Use the direct ordering link below.
        </p>
      )}
    </div>
  );
}
