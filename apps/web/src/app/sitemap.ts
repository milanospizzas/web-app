import type { MetadataRoute } from 'next';
import { menuPageHasPublishedItems, menuPages } from '@/content/menu';
import { featureFlags, loyaltySignupReady, publicSpecials } from '@/content/features';
import { absoluteUrl } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.SITE_ENV !== 'production') {
    return [];
  }

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/menu', priority: 0.9, changeFrequency: 'weekly' as const },
    ...menuPages.filter(menuPageHasPublishedItems).map((page) => ({
      path: `/menu/${page.slug}`,
      priority: 0.75,
      changeFrequency: 'weekly' as const,
    })),
    { path: '/catering', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/order', priority: 0.9, changeFrequency: 'weekly' as const },
  ];

  if (publicSpecials.length > 0) {
    routes.push({ path: '/specials', priority: 0.7, changeFrequency: 'daily' });
  }

  if (featureFlags.googleReviewUrl) {
    routes.push({ path: '/reviews', priority: 0.5, changeFrequency: 'monthly' });
  }

  if (loyaltySignupReady) {
    routes.push({ path: '/loyalty', priority: 0.5, changeFrequency: 'monthly' });
  }

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
