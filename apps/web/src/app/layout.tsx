import type { Metadata, Viewport } from 'next';
import { site } from '@/content/site';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import '../styles/globals.css';

const isProduction = process.env.SITE_ENV === 'production';
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Milano's Pizzas | Davie, Florida",
    template: "%s | Milano's Pizzas",
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: site.name,
    title: "Milano's Pizzas | Davie, Florida",
    description: site.description,
    url: site.url,
    images: [
      {
        url: '/images/social/milanos-davie-og.jpg',
        width: 1200,
        height: 630,
        alt: "The dining room and service counter at Milano's Pizzas in Davie",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Milano's Pizzas | Davie, Florida",
    description: site.description,
    images: ['/images/social/milanos-davie-og.jpg'],
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8f1d25',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
