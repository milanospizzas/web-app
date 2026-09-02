import { PageHero } from '@/components/content/PageHero';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { TrackedActionLink } from '@/components/analytics/TrackedActionLink';
import { site } from '@/content/site';
import { createPageMetadata } from '@/lib/seo/metadata';
import { featureFlags } from '@/content/features';

export const metadata = createPageMetadata({
  title: "Contact Milano's Pizzas | Davie, FL",
  description: `Find Milano's Pizzas at ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}. View hours, call ${site.phoneDisplay}, email us, or get directions.`,
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Call, visit, or order online"
        title="Contact Milano's Pizzas in Davie"
        intro={`${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }]}
        actions={
          <TrackedOrderLink className="button button-cream button-large" source="contact">
            Order Online
          </TrackedOrderLink>
        }
      />
      <section className="content-section contact-section">
        <div className="site-container contact-grid">
          <div className="contact-details">
            <p className="eyebrow">Visit Milano's</p>
            <h2>Everything you need for your visit</h2>
            <div className="contact-card-grid">
              <article>
                <h3>Address</h3>
                <address>
                  {site.address.street}<br />
                  {site.address.city}, {site.address.region} {site.address.postalCode}
                </address>
                <TrackedActionLink
                  href={site.directionsUrl}
                  eventName="directions_clicked"
                  location="contact-address"
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Get Directions
                </TrackedActionLink>
              </article>
              <article>
                <h3>Phone & email</h3>
                <TrackedActionLink
                  href={site.phoneHref}
                  eventName="phone_call_clicked"
                  location="contact-details"
                  className="text-link"
                >
                  {site.phoneDisplay}
                </TrackedActionLink>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </article>
              <article>
                <h3>Hours</h3>
                {site.hours.map((entry) => (
                  <p key={entry.days}><strong>{entry.days}</strong><br />{entry.hours}</p>
                ))}
              </article>
              <article>
                <h3>Follow Milano's</h3>
                <a href={site.social.instagram} target="_blank" rel="noreferrer">Instagram</a>
                <a href={site.social.facebook} target="_blank" rel="noreferrer">Facebook</a>
                {featureFlags.xEnabled && (
                  <a href={site.social.x} target="_blank" rel="noreferrer">X</a>
                )}
              </article>
            </div>
          </div>
          <div className="map-frame">
            <iframe
              src={site.mapEmbedUrl}
              title={`Map showing Milano's Pizzas at ${site.address.street} in ${site.address.city}, Florida`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
