import Link from 'next/link';
import { site } from '@/content/site';
import { BrandLogo } from '@/components/media/BrandLogo';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { TrackedActionLink } from '@/components/analytics/TrackedActionLink';
import { featureFlags } from '@/content/features';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div>
          <BrandLogo className="footer-logo" />
          <p className="footer-intro">
            Pizza, Italian favorites, and a neighborhood welcome in Davie, Florida.
          </p>
          <TrackedOrderLink className="button button-cream" source="site-footer">
            Order Online
          </TrackedOrderLink>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/catering">Catering</Link></li>
            <li><Link href="/reviews">Reviews</Link></li>
            <li><Link href="/specials">Specials</Link></li>
            <li><Link href="/loyalty">Loyalty</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h2>Visit Milano's</h2>
          <address>
            {site.address.street}<br />
            {site.address.city}, {site.address.region} {site.address.postalCode}
          </address>
          <TrackedActionLink
            href={site.phoneHref}
            eventName="phone_call_clicked"
            location="site-footer"
          >
            {site.phoneDisplay}
          </TrackedActionLink><br />
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <p className="footer-socials">
            <a href={site.social.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a href={site.social.facebook} target="_blank" rel="noreferrer">Facebook</a>
            {featureFlags.xEnabled && (
              <a href={site.social.x} target="_blank" rel="noreferrer">X</a>
            )}
          </p>
        </div>
        <div>
          <h2>Hours</h2>
          {site.hours.map((entry) => (
            <p key={entry.days}><span>{entry.days}</span><br />{entry.hours}</p>
          ))}
        </div>
      </div>
      <div className="site-container footer-bottom">
        <p>© {new Date().getFullYear()} Milano's Pizzas</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
