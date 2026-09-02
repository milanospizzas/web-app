import Script from 'next/script';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const analyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.SITE_ENV === 'production' &&
  process.env.ANALYTICS_ENABLED === 'true' &&
  /^G-[A-Z0-9]+$/i.test(measurementId ?? '');

export function AnalyticsScripts() {
  if (!analyticsEnabled || !measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false,page_location:window.location.origin+window.location.pathname,page_referrer:''});`}
      </Script>
    </>
  );
}
