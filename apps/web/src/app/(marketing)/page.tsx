import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import { RestaurantInterior } from '@/components/media/RestaurantInterior';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { TrackedActionLink } from '@/components/analytics/TrackedActionLink';
import { createPageMetadata } from '@/lib/seo/metadata';
import { approvedRestaurantStory } from '@/content/story';
import { featureFlags } from '@/content/features';
import { FeaturedFavorites } from '@/components/menu/FeaturedFavorites';

export const metadata: Metadata = createPageMetadata({
  title: "Milano's Pizzas | Pizza & Italian Favorites in Davie, FL",
  description:
    "Visit Milano's Pizzas in Davie, Florida for thin-crust pizza and Italian-American favorites. View the menu, request catering, or start an online order.",
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow light">Davie's neighborhood pizzeria</p>
            <h1>Pizza night starts at Milano's.</h1>
            <p className="hero-lede">
              From thin-crust pizza to baked Italian favorites, find something for the whole
              table at Milano's Pizzas in Davie.
            </p>
            <div className="hero-actions">
              <TrackedOrderLink className="button button-cream button-large" source="homepage-hero">
                Order Online
              </TrackedOrderLink>
              <Link className="button button-outline-light button-large" href="/menu">
                View Menu
              </Link>
            </div>
            <p className="hero-note">
              The live ordering workflow is securely handled by our configured ordering provider.
            </p>
          </div>
          <div className="hero-visual">
            <div className="hero-image-ring">
              <RestaurantInterior className="hero-image" loading="eager" />
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <span>Made for</span>
              <strong>Davie</strong>
            </div>
          </div>
        </div>
      </section>

      <FeaturedFavorites />

      <section className="content-section home-menu-discovery">
        <div className="site-container">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Explore the menu</p>
              <h2>Find your Milano's favorite</h2>
            </div>
            <p>
              Browse first-party menu content here without unverified pricing. Current selections
              and availability are maintained in online ordering.
            </p>
          </div>
          <div className="home-category-grid">
            {[
              { label: 'Pizza', href: '/menu/pizza', number: '01' },
              { label: 'Pasta', href: '/menu/pasta', number: '02' },
              { label: 'Wings & Appetizers', href: '/menu/wings-appetizers', number: '03' },
              { label: 'Baked Dishes', href: '/menu/baked-dishes', number: '04' },
            ].map((category) => (
              <Link key={category.href} className="home-category-card" href={category.href}>
                <span>{category.number}</span>
                <h3>{category.label}</h3>
                <strong aria-hidden="true">→</strong>
              </Link>
            ))}
          </div>
          <Link className="text-link arrow-link" href="/menu">
            Explore the full menu <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="direct-order-section">
        <div className="site-container direct-order-grid">
          <div>
            <p className="eyebrow light">A clear path to your order</p>
            <h2>Discover here. Order through Milano's storefront.</h2>
          </div>
          <ol>
            <li><span>1</span><div><h3>Browse Milano's</h3><p>Explore the menu, catering, story, and location on our website.</p></div></li>
            <li><span>2</span><div><h3>Continue securely</h3><p>Every Order Online button leads through our permanent internal /order page.</p></div></li>
            <li><span>3</span><div><h3>Complete online</h3><p>Our ordering provider handles the live ordering workflow and payment outside this website.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="welcome-section">
        <div className="site-container welcome-grid">
          <div>
            <p className="eyebrow">Welcome to Milano's</p>
            <h2>A local table with Italian roots.</h2>
          </div>
          <div>
            <p>{approvedRestaurantStory}</p>
            <Link className="text-link arrow-link" href="/about">Read our story <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="home-reviews-section">
        <div className="site-container home-reviews-inner">
          <div>
            <p className="eyebrow">Guest feedback</p>
            <h2>See What Our Guests Are Saying</h2>
          </div>
          <div>
            <p>{featureFlags.googleReviewUrl
              ? "Visit Milano's verified Google profile to read current guest feedback. We do not republish names, ratings, or excerpts here."
              : 'Review excerpts, names, ratings, and totals stay off this site until the exact review source is verified.'}</p>
            {featureFlags.googleReviewUrl && (
              <a className="button button-primary" href={featureFlags.googleReviewUrl} target="_blank" rel="noreferrer">
                Read Our Reviews
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="home-catering-section">
        <div className="site-container home-catering-inner">
          <div>
            <p className="eyebrow light">Gather with Milano's</p>
            <h2>Catering for the table you are bringing together.</h2>
            <p>
              Explore general catering categories, then send the restaurant your event details for
              an availability and pricing follow-up.
            </p>
          </div>
          <Link className="button button-cream button-large" href="/catering">
            Request a Catering Quote
          </Link>
        </div>
      </section>

      <section className="home-location-section">
        <div className="site-container home-location-grid">
          <div>
            <p className="eyebrow">Find us in Davie</p>
            <h2>{site.address.street}</h2>
            <p>{site.address.city}, {site.address.region} {site.address.postalCode}</p>
            <div className="hours-summary dark">
              {site.hours.map((entry) => (
                <p key={entry.days}><span>{entry.days}</span><strong>{entry.hours}</strong></p>
              ))}
            </div>
            <div className="location-actions">
              <TrackedActionLink
                className="button button-primary"
                href={site.phoneHref}
                eventName="phone_call_clicked"
                location="homepage-location"
              >
                Call {site.phoneDisplay}
              </TrackedActionLink>
              <TrackedActionLink
                className="text-link"
                href={site.directionsUrl}
                eventName="directions_clicked"
                location="homepage-location"
                target="_blank"
                rel="noreferrer"
              >
                Get Directions
              </TrackedActionLink>
            </div>
          </div>
          <div className="map-frame home-map">
            <iframe
              src={site.mapEmbedUrl}
              title="Map showing Milano's Pizzas in Davie, Florida"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <TrackedOrderLink className="mobile-sticky-order" source="sticky-mobile">
        Order Online
      </TrackedOrderLink>
    </>
  );
}
