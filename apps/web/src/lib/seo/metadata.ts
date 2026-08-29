import type { Metadata } from 'next';
import { absoluteUrl } from '@/content/site';

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const fullTitle = title.includes("Milano's") ? title : `${title} | Milano's Pizzas`;
  const canonical = absoluteUrl(path);
  const socialImage = absoluteUrl('/images/social/milanos-davie-og.jpg');

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: fullTitle,
      description,
      url: canonical,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "The dining room and service counter at Milano's Pizzas in Davie",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [socialImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false, nocache: true } } : {}),
  };
}
