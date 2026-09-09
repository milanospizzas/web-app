'use client';

import { useEffect, useState } from 'react';
import { TrackedOrderLink } from '@/components/analytics/TrackedOrderLink';

export function MobileStickyOrder({ menuOpen }: { menuOpen: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroAction = document.querySelector('.hero-actions a');
    const footer = document.querySelector('.site-footer');
    if (!heroAction || !footer || !('IntersectionObserver' in window)) return;

    let heroPassed = false;
    let footerVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroAction) {
          heroPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        }
        if (entry.target === footer) footerVisible = entry.isIntersecting;
      }
      setVisible(heroPassed && !footerVisible);
    });
    observer.observe(heroAction);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!visible || menuOpen) return null;

  return (
    <nav className="mobile-sticky-order-nav" aria-label="Quick ordering">
      <TrackedOrderLink className="mobile-sticky-order" source="sticky-mobile">
        Order Online
      </TrackedOrderLink>
    </nav>
  );
}
