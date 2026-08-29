import { legalContentStatus } from '@/content/legal';

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

function verifiedGoogleUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowed =
      url.hostname === 'google.com' ||
      url.hostname.endsWith('.google.com') ||
      url.hostname === 'maps.app.goo.gl';
    return url.protocol === 'https:' && allowed && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function safeFormDestination(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export const featureFlags = {
  specialsEnabled: enabled(process.env.SPECIALS_ENABLED),
  loyaltyEnabled: enabled(process.env.LOYALTY_ENABLED),
  marketingSignupEnabled: enabled(process.env.MARKETING_SIGNUP_ENABLED),
  xEnabled: enabled(process.env.X_ENABLED),
  googleReviewUrl: verifiedGoogleUrl(process.env.GOOGLE_REVIEW_URL),
} as const;

export interface Special {
  title: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  description: string;
  displayedPrice: number | null;
  eligibility: Array<'dine-in' | 'pickup' | 'delivery'>;
  startDate: string | null;
  endDate: string | null;
  enabled: boolean;
}

export const specials: Special[] = [];

export interface LoyaltySignupConfig {
  loyaltyEnabled: boolean;
  marketingSignupEnabled: boolean;
  destination: string | null;
  approvedConsentText: string | null;
  unsubscribeHandlingConfigured: boolean;
  privacyCopyApproved: boolean;
  displayedRewardRate: number | null;
}

export const loyaltySignupConfig: LoyaltySignupConfig = {
  loyaltyEnabled: featureFlags.loyaltyEnabled,
  marketingSignupEnabled: featureFlags.marketingSignupEnabled,
  destination: safeFormDestination(process.env.MARKETING_SIGNUP_DESTINATION),
  approvedConsentText: process.env.MARKETING_CONSENT_TEXT?.trim() || null,
  unsubscribeHandlingConfigured: enabled(process.env.MARKETING_UNSUBSCRIBE_CONFIGURED),
  privacyCopyApproved:
    legalContentStatus.privacyCopyPresentAndApproved &&
    enabled(process.env.PRIVACY_COPY_APPROVED),
  displayedRewardRate: null,
};

export const loyaltySignupReady = Boolean(
  loyaltySignupConfig.loyaltyEnabled &&
    loyaltySignupConfig.marketingSignupEnabled &&
    loyaltySignupConfig.destination &&
    loyaltySignupConfig.approvedConsentText &&
    loyaltySignupConfig.unsubscribeHandlingConfigured &&
    loyaltySignupConfig.privacyCopyApproved,
);

export const publicSpecials = featureFlags.specialsEnabled
  ? specials.filter((special) => special.enabled)
  : [];
