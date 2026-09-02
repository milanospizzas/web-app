import { PageHero } from '@/components/content/PageHero';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: "Privacy Notice (Draft) | Milano's Pizzas",
  description:
    "Draft privacy-page placeholder for Milano's Pizzas. Final language is pending approval after website data flows are finalized.",
  path: '/privacy',
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Draft — not final legal text"
        title="Privacy Notice (Draft)"
        intro="This route is reserved for owner-reviewed privacy language and remains excluded from search indexing."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy', href: '/privacy' }]}
        compact
      />
      <section className="content-section legal-draft-section">
        <div className="site-container narrow-container legal-draft-card">
          <h2>Pending data-flow review</h2>
          <p>
            Final privacy language will be written after the analytics, catering inquiry, contact,
            cookie, marketing, and SkyTab redirect data flows are finalized and approved.
          </p>
          <p>This staging placeholder is not presented as an approved privacy policy.</p>
        </div>
      </section>
    </>
  );
}
