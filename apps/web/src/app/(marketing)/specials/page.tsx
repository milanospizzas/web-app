import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { publicSpecials } from '@/content/features';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Milano's Pizzas Specials | Davie, FL",
  description: publicSpecials.length > 0
    ? "View current, verified Milano's Pizzas website specials in Davie, Florida."
    : "No verified website specials are currently published. View Milano's Pizzas menu or begin an online order from Davie, Florida.",
  path: '/specials',
  noIndex: publicSpecials.length === 0,
});

export default function SpecialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Config-driven offers"
        title="Milano's Pizzas Specials"
        intro="Only verified, currently approved offers will appear here."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Specials', href: '/specials' }]}
      />
      <section className="content-section empty-state-section">
        <div className="site-container narrow-container">
          {publicSpecials.length === 0 ? (
            <div className="empty-state-card">
              <p className="eyebrow">Nothing unverified</p>
              <h2>No website specials are published right now.</h2>
              <p>
                Promotions, timing, eligibility, and pricing are kept offline until Milano's has
                verified each detail against current restaurant operations.
              </p>
            </div>
          ) : (
            <div className="specials-grid">
              {publicSpecials.map((special) => {
                const timing = [
                  special.day,
                  special.startTime && special.endTime
                    ? `${special.startTime}–${special.endTime}`
                    : null,
                ].filter(Boolean).join(' · ');

                return (
                  <article className="special-card" key={`${special.title}-${special.startDate ?? 'current'}`}>
                    <p className="eyebrow">Verified offer</p>
                    <h2>{special.title}</h2>
                    <p>{special.description}</p>
                    {timing && <p className="special-meta"><strong>When:</strong> {timing}</p>}
                    {(special.startDate || special.endDate) && (
                      <p className="special-meta">
                        <strong>Dates:</strong> {special.startDate ?? 'Now'}–{special.endDate ?? 'Ongoing'}
                      </p>
                    )}
                    {special.eligibility.length > 0 && (
                      <p className="special-meta">
                        <strong>Available for:</strong> {special.eligibility.join(', ')}
                      </p>
                    )}
                    {special.displayedPrice !== null && (
                      <p className="special-price">${special.displayedPrice.toFixed(2)}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <OrderCta source="specials" />
    </>
  );
}
