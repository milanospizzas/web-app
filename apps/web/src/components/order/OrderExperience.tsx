'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PublicOrderConfig } from '@/lib/order/config';
import { normalizeAnalyticsValue, trackEvent } from '@/lib/analytics/events';
import { checkoutDestinationWithTracking } from '@/lib/order/tracking';
import { site } from '@/content/site';
import { DirectOrderFallback } from '@/components/order/DirectOrderFallback';

export function OrderExperience({ config }: { config: PublicOrderConfig }) {
  const [isMobile, setIsMobile] = useState(true);
  const [showFrame, setShowFrame] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [source, setSource] = useState(() => normalizeAnalyticsValue(null));

  useEffect(() => {
    const current = new URL(window.location.href);
    setSource(normalizeAnalyticsValue(current.searchParams.get('source')));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const destination = useMemo(() => {
    if (!config.checkoutUrl) return null;
    return checkoutDestinationWithTracking(config.checkoutUrl, {
      get: (key) => (key === 'source' ? source : null),
    });
  }, [config.checkoutUrl, source]);

  const canUseFrame = Boolean(
    destination && config.mode === 'iframe' && config.iframeEnabled && !isMobile
  );

  useEffect(() => {
    if (!showFrame || frameLoaded || frameFailed) return;
    const timeout = window.setTimeout(() => setFrameFailed(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [frameFailed, frameLoaded, showFrame]);

  function revealFrame() {
    if (config.provider === 'skytab') {
      trackEvent('skytab_iframe_attempted', { source, provider: config.provider });
    }
    setFrameFailed(false);
    setFrameLoaded(false);
    setShowFrame(true);
  }

  function trackRedirect() {
    if (config.provider === 'skytab') {
      trackEvent('skytab_redirect_clicked', { source, provider: config.provider });
    }
  }

  if (!destination) {
    return (
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
    );
  }

  return (
    <div className="order-dynamic">
      {canUseFrame && showFrame && !frameFailed ? (
        <div className="order-frame-shell">
          {!frameLoaded && (
            <p className="order-status" role="status">
              Loading SkyTab ordering…
            </p>
          )}
          <iframe
            className="order-frame"
            src={destination}
            title="SkyTab online ordering storefront"
            onLoad={() => {
              setFrameLoaded(true);
              setFrameFailed(false);
            }}
            onError={() => setFrameFailed(true)}
          />
        </div>
      ) : canUseFrame ? (
        <button className="button button-primary button-large" type="button" onClick={revealFrame}>
          View SkyTab ordering here
        </button>
      ) : (
        <a
          className="button button-primary button-large"
          href={destination}
          onClick={trackRedirect}
        >
          Continue to SkyTab
        </a>
      )}

      {frameFailed && (
        <p className="order-error" role="alert">
          The embedded SkyTab ordering storefront did not load. Use the direct link below.
        </p>
      )}

      <DirectOrderFallback destination={destination} provider={config.provider} source={source} />
    </div>
  );
}
