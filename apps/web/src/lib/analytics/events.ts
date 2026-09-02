export type AnalyticsEventName =
  | 'order_button_clicked'
  | 'order_page_viewed'
  | 'skytab_redirect_clicked'
  | 'skytab_iframe_attempted'
  | 'menu_item_order_clicked'
  | 'catering_lead_submitted'
  | 'loyalty_signup_completed'
  | 'phone_call_clicked'
  | 'directions_clicked';

type SafeEventParameters = {
  source?: string;
  provider?: 'skytab' | 'custom';
  link_location?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const APPROVED_SOURCES = new Set([
  'direct',
  'site-header',
  'site-footer',
  'mobile-menu',
  'sticky-mobile',
  'homepage-hero',
  'menu-landing',
  'menu-landing-bottom',
  'menu-pizza',
  'menu-pizza-bottom',
  'menu-specialty-pizza',
  'menu-specialty-pizza-bottom',
  'menu-wings-appetizers',
  'menu-wings-appetizers-bottom',
  'menu-soups',
  'menu-soups-bottom',
  'menu-salads',
  'menu-salads-bottom',
  'menu-side-orders',
  'menu-side-orders-bottom',
  'menu-subs',
  'menu-subs-bottom',
  'menu-pasta',
  'menu-pasta-bottom',
  'menu-ravioli',
  'menu-ravioli-bottom',
  'menu-baked-dishes',
  'menu-baked-dishes-bottom',
  'menu-meat-dishes',
  'menu-meat-dishes-bottom',
  'menu-chicken-dishes',
  'menu-chicken-dishes-bottom',
  'menu-kids',
  'menu-kids-bottom',
  'menu-desserts',
  'menu-desserts-bottom',
  'menu-beverages',
  'menu-beverages-bottom',
  'menu-lunch',
  'menu-lunch-bottom',
  'catering',
  'catering-form',
  'about',
  'reviews',
  'loyalty',
  'specials',
  'contact',
  'not-found',
  'featured-cheese-pizza',
  'featured-milanos-special-pizza',
  'featured-meat-lovers-pizza',
  'featured-margherita-pizza',
  'featured-garlic-rolls',
  'featured-chicken-parmigiana',
  'featured-baked-ziti',
  'featured-lasagna',
  'featured-wings-with-fries',
]);

const APPROVED_LINK_LOCATIONS = new Set([
  'announcement-bar',
  'site-footer',
  'homepage-location',
  'contact-address',
  'contact-details',
]);

export function normalizeAnalyticsValue(value: string | null | undefined, fallback = 'direct') {
  if (!value) return fallback;
  const normalized = value.trim().slice(0, 100);
  return APPROVED_SOURCES.has(normalized) ? normalized : fallback;
}

export function trackEvent(eventName: AnalyticsEventName, parameters: SafeEventParameters = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const safeParameters: SafeEventParameters = {};
  if (parameters.source) safeParameters.source = normalizeAnalyticsValue(parameters.source);
  if (parameters.provider) safeParameters.provider = parameters.provider;
  if (parameters.link_location) {
    safeParameters.link_location = APPROVED_LINK_LOCATIONS.has(parameters.link_location)
      ? parameters.link_location
      : 'unknown';
  }

  window.gtag('event', eventName, {
    ...safeParameters,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: '',
  });
}

/** Reserved for the disabled loyalty adapter; do not call until signup is approved and active. */
export function trackLoyaltySignupCompleted(source: string) {
  trackEvent('loyalty_signup_completed', { source: normalizeAnalyticsValue(source) });
}
