import { PageHero } from '@/components/content/PageHero';
import { CateringQuoteForm } from '@/components/catering/CateringQuoteForm';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { createPageMetadata } from '@/lib/seo/metadata';

const cateringCategories = [
  'Pizza packages',
  'Pasta packages',
  'Italian entrée packages',
  'Chicken packages',
  'Salads and sides',
  'Garlic rolls',
  'Sandwich and deli platters',
  'Desserts and beverages',
];

export const metadata = createPageMetadata({
  title: "Catering in Davie, FL | Milano's Pizzas",
  description:
    "Request a catering quote from Milano's Pizzas in Davie for pizza, pasta, entrées, chicken, salads, sides, rolls, platters, desserts, and beverages.",
  path: '/catering',
});

export default function CateringPage() {
  return (
    <>
      <PageHero
        eyebrow="Gather around Milano's"
        title="Catering from Milano's Pizzas in Davie"
        intro="Tell us about your gathering and the Milano's team will follow up directly about availability and final pricing."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Catering', href: '/catering' }]}
        actions={
          <a className="button button-cream button-large" href="#catering-quote">
            Request a Catering Quote
          </a>
        }
      />

      <section className="content-section catering-options">
        <div className="site-container">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Catering categories</p>
              <h2>Build a spread for your gathering</h2>
            </div>
            <p>
              These general categories are a starting point. No price, minimum notice, delivery
              range, or availability promise is published on this page.
            </p>
          </div>
          <ul className="catering-category-grid">
            {cateringCategories.map((category, index) => (
              <li key={category}><span>{String(index + 1).padStart(2, '0')}</span>{category}</li>
            ))}
          </ul>
          <TrackedOrderLink className="text-link arrow-link" source="catering">
            Ordering for today? Continue online <span aria-hidden="true">→</span>
          </TrackedOrderLink>
        </div>
      </section>

      <section id="catering-quote" className="content-section form-section">
        <div className="site-container narrow-container">
          <CateringQuoteForm />
        </div>
      </section>
    </>
  );
}
