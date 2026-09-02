import Link from 'next/link';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';

export default function NotFound() {
  return (
    <main id="main-content" className="standalone-state-page">
      <div className="standalone-state-card">
        <p className="eyebrow">Page not found</p>
        <h1>That page is not on the menu.</h1>
        <p>Return home, browse Milano's menu, or start an online order.</p>
        <div className="state-actions">
          <Link className="button button-primary" href="/">Go Home</Link>
          <Link className="button button-outline-dark" href="/menu">View Menu</Link>
          <TrackedOrderLink className="text-link" source="not-found">Order Online</TrackedOrderLink>
        </div>
      </div>
    </main>
  );
}
