import { PageHero } from '@/components/content/PageHero';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Terms of Use (Draft) | Milano's Pizzas",
  description:
    "Draft terms-page placeholder for Milano's Pizzas. Final language is pending review and approval before production publication.",
  path: '/terms',
  noIndex: true,
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Draft — not final legal text"
        title="Terms of Use (Draft)"
        intro="This route is reserved for owner-reviewed terms and remains excluded from search indexing."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms', href: '/terms' }]}
        compact
      />
      <section className="content-section legal-draft-section">
        <div className="site-container narrow-container legal-draft-card">
          <h2>Pending owner and legal review</h2>
          <p>
            Final terms will be prepared after the website's ordering redirect, forms, analytics,
            and other public data flows are finalized.
          </p>
          <p>This staging placeholder is not presented as approved terms of use.</p>
        </div>
      </section>
    </>
  );
}
