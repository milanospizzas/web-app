import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import { RestaurantInterior } from '@/components/media/RestaurantInterior';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { TrackedActionLink } from '@/components/analytics/TrackedActionLink';
import { createPageMetadata } from '@/lib/seo/metadata';
import { approvedRestaurantStory } from '@/content/story';
import { featureFlags } from '@/content/features';
import { menuPages, menuPageHasPublishedItems } from '@/content/menu';
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
              Online ordering continues in SkyTab.
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
              Explore our menu, then continue to online ordering for the latest selection and availability.
            </p>
          </div>
          <div className="home-category-grid">
            {menuPages.filter(menuPageHasPublishedItems).slice(0, 4).map((category, index) => (
              <Link key={category.slug} className="home-category-card" href={`/menu/${category.slug}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
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

      {featureFlags.googleReviewUrl && (
        <section className="home-reviews-section">
          <div className="site-container home-reviews-inner">
            <div>
              <p className="eyebrow">Guest feedback</p>
              <h2>See What Our Guests Are Saying</h2>
            </div>
            <div>
              <p>Read guest feedback on Milano's Google profile.</p>
              <a className="button button-primary" href={featureFlags.googleReviewUrl} target="_blank" rel="noreferrer">
                Read Our Reviews
              </a>
            </div>
          </div>
        </section>
      )}

    </>
  );
}
