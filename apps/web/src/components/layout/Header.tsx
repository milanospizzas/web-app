'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { site } from '@/content/site';
import { BrandLogo } from '@/components/media/BrandLogo';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';
import { TrackedActionLink } from '@/components/analytics/TrackedActionLink';

const navigation = [
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'Our Story' },
  { href: '/catering', label: 'Catering' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Visit Us' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="announcement-bar">
        <div className="site-container announcement-inner">
          <span>Serving Davie, Florida</span>
          <TrackedActionLink
            href={site.phoneHref}
            eventName="phone_call_clicked"
            location="announcement-bar"
            ariaLabel={`Call Milano's Pizzas at ${site.phoneDisplay}`}
          >
            Call {site.phoneDisplay}
          </TrackedActionLink>
        </div>
      </div>
      <header className="site-header">
        <nav className="site-container nav-shell" aria-label="Primary navigation">
          <Link
            href="/"
            className="brand-link"
            aria-label="Milano's Pizzas home"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <BrandLogo className="brand-logo" loading="eager" />
            <span className="brand-name">Milano's Pizzas</span>
          </Link>

          <div className="desktop-nav">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? 'nav-link active' : 'nav-link'}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="nav-actions">
            <TrackedOrderLink className="button button-primary header-order" source="site-header">
              Order Online
            </TrackedOrderLink>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div id="mobile-navigation" className="mobile-nav">
            <div className="site-container mobile-nav-inner">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? 'active' : undefined}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <TrackedOrderLink source="mobile-menu">Order Online</TrackedOrderLink>
            </div>
          </div>
        )}
        <noscript>
          <style>{'.menu-toggle{display:none!important}'}</style>
          <nav className="mobile-nav noscript-mobile-nav" aria-label="Primary navigation fallback">
            <div className="site-container mobile-nav-inner">
              {navigation.map((item) => (
                <a key={item.href} href={item.href}>{item.label}</a>
              ))}
              <a href="/order?source=mobile-menu">Order Online</a>
            </div>
          </nav>
        </noscript>
      </header>
    </>
  );
}
