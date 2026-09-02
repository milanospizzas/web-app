import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { LoyaltySignupForm } from '@/components/loyalty/LoyaltySignupForm';
import { loyaltySignupConfig, loyaltySignupReady } from '@/content/features';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Milano's Loyalty Updates | Davie, FL",
  description: loyaltySignupReady
    ? "Sign up for approved Milano's Pizzas updates from Davie, Florida."
    : "Milano's Pizzas loyalty and marketing signup are currently disabled. No names, phone numbers, or email addresses are collected on this page.",
  path: '/loyalty',
  noIndex: !loyaltySignupReady,
});

export default function LoyaltyPage() {
  return (
    <>
      <PageHero
        eyebrow="Built for future updates"
        title="Milano's Loyalty Updates"
        intro={loyaltySignupReady
          ? "Use the approved signup form below to receive Milano's updates."
          : 'Loyalty and marketing enrollment are not active, so this page does not collect personal information.'}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Loyalty', href: '/loyalty' }]}
      />
      <section className={`content-section ${loyaltySignupReady ? 'form-section' : 'empty-state-section'}`}>
        <div className="site-container narrow-container">
          {loyaltySignupReady ? (
            <LoyaltySignupForm config={loyaltySignupConfig} />
          ) : (
            <div className="empty-state-card">
              <p className="eyebrow">Signup disabled</p>
              <h2>No loyalty or marketing form is active.</h2>
              <p>
                Enrollment will remain hidden until the platform, consent language, unsubscribe
                handling, form destination, and privacy language are approved. No reward rate or
                reward promise is published.
              </p>
            </div>
          )}
        </div>
      </section>
      <OrderCta source="loyalty" />
    </>
  );
}
