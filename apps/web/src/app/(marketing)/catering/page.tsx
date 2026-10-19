import { PageHero } from '@/components/content/PageHero';
import { CateringQuoteForm } from '@/components/catering/CateringQuoteForm';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { createPageMetadata } from '@/lib/seo/metadata';
import Link from 'next/link';

const cateringCategories = [
  'Pasta trays',
  'Chicken and eggplant trays',
  'Salad trays and platters',
  'Garlic rolls',
  'Italian buffet packages',
  'Grilled chicken packages',
  'Sliders and deli platters',
  'Pizza and garlic rolls combo',
];

export const metadata = createPageMetadata({
  title: "Catering in Davie, FL | Milano's Pizzas",
  description:
    "Browse catering trays and packages from Milano's Pizzas in Davie, then request a quote for pizza, pasta, chicken, salads, garlic rolls, sliders, and deli platters.",
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
          <>
            <a className="button button-cream button-large" href="#catering-quote">
              Request a Catering Quote
            </a>
            <Link className="button button-outline-light button-large" href="/menu#menu-catering">
              View Catering Menu
            </Link>
          </>
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
              Explore our catering menu for tray sizes, package prices, serving counts and minimums.
              Contact Milano&apos;s to confirm availability and plan your gathering.
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
