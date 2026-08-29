import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { featureFlags } from '@/content/features';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Milano's Pizzas Reviews | Davie, FL",
  description:
    "Connect to the verified review profile for Milano's Pizzas in Davie. Review excerpts, ratings, and totals are not reproduced on this page.",
  path: '/reviews',
  noIndex: !featureFlags.googleReviewUrl,
});

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Community feedback"
        title="See What Our Guests Are Saying"
        intro="We do not reproduce reviewer names, excerpts, star ratings, or totals without a verified source."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Reviews', href: '/reviews' }]}
      />
      <section className="content-section empty-state-section">
        <div className="site-container narrow-container">
          <div className="empty-state-card">
            {featureFlags.googleReviewUrl ? (
              <>
                <p className="eyebrow">Verified profile</p>
                <h2>Read guest feedback at the source.</h2>
                <p>
                  Open Milano's verified Google profile to read current guest feedback. This
                  website does not reproduce reviewer names, excerpts, ratings, or totals.
                </p>
              <a
                className="button button-primary"
                href={featureFlags.googleReviewUrl}
                target="_blank"
                rel="noreferrer"
              >
                Read Our Reviews
              </a>
              </>
            ) : (
              <>
                <p className="eyebrow">Verified links only</p>
                <h2>Our review profile link is being verified.</h2>
                <p>
                  The “Read Our Reviews” action will appear after Milano's exact Google Business
                  Profile place URL is confirmed. No reviews or ratings are fabricated here.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <OrderCta source="reviews" />
    </>
  );
}
