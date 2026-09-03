import { normalizeAnalyticsValue } from '@/lib/analytics/events';

export const CAMPAIGN_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

function containsControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
  });
}

export function safeCampaignValue(value: string | null) {
  if (!value) return null;
  const bounded = value.trim().slice(0, 100);
  return bounded && !containsControlCharacter(bounded) ? bounded : null;
}

export function checkoutDestinationWithTracking(
  checkoutUrl: string,
  searchParams: Pick<URLSearchParams, 'get'>
) {
  const destination = new URL(checkoutUrl);
  destination.searchParams.set('source', normalizeAnalyticsValue(searchParams.get('source')));

  return destination.toString();
}
