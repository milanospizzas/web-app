import { PageHero } from '@/components/content/PageHero';
import { OrderCta } from '@/components/content/OrderCta';
import { RestaurantInterior } from '@/components/media/RestaurantInterior';
import { approvedRestaurantStory } from '@/content/story';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "About Milano's Pizzas | Davie, Florida",
  description:
    "Learn about Milano's Pizzas, a family-owned neighborhood restaurant serving thin-crust pizza and Italian-American favorites in Davie, Florida.",
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our neighborhood table"
        title="About Milano's Pizzas"
        intro="A family-owned restaurant bringing thin-crust pizza and Italian-American favorites to Davie."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }]}
      />

      <section className="content-section story-section">
        <div className="site-container story-grid">
          <div className="story-image-frame">
            <RestaurantInterior className="story-image" sizes="(min-width: 760px) 48vw, 92vw" />
          </div>
          <div className="story-copy">
            <p className="eyebrow">The Milano's story</p>
            <h2>Italian traditions, New York-style influence, and a Davie welcome.</h2>
            <p className="large-copy">{approvedRestaurantStory}</p>
            <p>
              Milano's combines Italian cooking traditions with New York-style pizza influences in
              a casual neighborhood setting. Guests can join us for dine-in, arrange catering, or
              continue to our online ordering storefront.
            </p>
          </div>
        </div>
      </section>

      <OrderCta source="about" title="Bring Milano's to your table" />
    </>
  );
}
