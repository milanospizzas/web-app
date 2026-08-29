import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/components/seo/Breadcrumbs';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
  compact?: boolean;
}

export function PageHero({ eyebrow, title, intro, breadcrumbs, actions, compact }: PageHeroProps) {
  return (
    <section className={compact ? 'page-hero compact' : 'page-hero'}>
      <div className="page-hero-texture" aria-hidden="true" />
      <div className="site-container page-hero-inner">
        <Breadcrumbs items={breadcrumbs} />
        <p className="eyebrow light">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-hero-intro">{intro}</p>
        {actions && <div className="page-hero-actions">{actions}</div>}
      </div>
    </section>
  );
}
