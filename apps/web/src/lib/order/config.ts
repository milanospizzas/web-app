export type OrderProvider = 'skytab' | 'custom';
export type OrderMode = 'redirect' | 'iframe';

export interface PublicOrderConfig {
  provider: OrderProvider;
  mode: OrderMode;
  checkoutUrl: string | null;
  iframeEnabled: boolean;
}

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

function safeStorefrontUrl(value: string | undefined, allowedHostname?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (allowedHostname && url.hostname !== allowedHostname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Build-time provider boundary for the public /order route. The storefront URL
 * is public by design; no POS, payment, or Shift4 credentials belong here.
 */
export function getPublicOrderConfig(): PublicOrderConfig {
  const provider: OrderProvider =
    process.env.ORDER_PROVIDER?.toLowerCase() === 'custom' ? 'custom' : 'skytab';
  const requestedMode: OrderMode =
    process.env.ORDER_MODE?.toLowerCase() === 'iframe' ? 'iframe' : 'redirect';
  const customOrderingEnabled = isEnabled(process.env.CUSTOM_ORDERING_ENABLED);
  const customPaymentEnabled = isEnabled(process.env.CUSTOM_PAYMENT_ENABLED);
  const iframeEnabled =
    process.env.SITE_ENV === 'staging' && isEnabled(process.env.SKYTAB_IFRAME_ENABLED);

  if (provider === 'custom') {
    return {
      provider,
      mode: 'redirect',
      checkoutUrl: customOrderingEnabled && customPaymentEnabled
        ? safeStorefrontUrl(process.env.CUSTOM_ORDER_URL)
        : null,
      iframeEnabled: false,
    };
  }

  return {
    provider,
    mode: requestedMode === 'iframe' && iframeEnabled ? 'iframe' : 'redirect',
    checkoutUrl: safeStorefrontUrl(process.env.SKYTAB_ORDER_URL, 'online.skytab.com'),
    iframeEnabled,
  };
}
