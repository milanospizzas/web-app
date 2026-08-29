import { site } from '@/content/site';
import { JsonLd } from './JsonLd';
import { featureFlags } from '@/content/features';

export function RestaurantJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        '@id': `${site.url}/#restaurant`,
        name: site.name,
        url: site.url,
        image: `${site.url}/images/social/milanos-davie-og.jpg`,
        telephone: site.phoneDisplay,
        email: site.email,
        servesCuisine: ['Pizza', 'Italian-American'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        openingHoursSpecification: site.hours.map((entry) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: entry.schemaDays,
            opens: entry.opens,
            closes: entry.closes,
          })),
        sameAs: [
          site.social.instagram,
          site.social.facebook,
          ...(featureFlags.xEnabled ? [site.social.x] : []),
        ],
      }}
    />
  );
}
