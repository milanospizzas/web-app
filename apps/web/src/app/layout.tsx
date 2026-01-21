import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Milano's Pizza - Authentic Italian Pizza Delivery",
  description:
    "Order delicious, authentic Italian pizza for delivery or pickup. Fresh ingredients, family recipes, and fast delivery.",
  keywords: ['pizza', 'delivery', 'italian food', 'restaurant', 'milano'],
  authors: [{ name: "Milano's Pizza" }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://milanos.pizza',
    siteName: "Milano's Pizza",
    title: "Milano's Pizza - Authentic Italian Pizza Delivery",
    description: 'Order delicious, authentic Italian pizza for delivery or pickup.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Milano's Pizza",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Milano's Pizza - Authentic Italian Pizza Delivery",
    description: 'Order delicious, authentic Italian pizza for delivery or pickup.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
