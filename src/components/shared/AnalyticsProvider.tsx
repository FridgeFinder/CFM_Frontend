'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_TRACKING_ID } from 'config/analytics';
import { useAnalyticsStore } from 'store/useAnalyticsStore';
import { pageview } from 'lib/analytics';

export function AnalyticsProvider(): React.ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setInitialized = useAnalyticsStore((state) => state.setInitialized);
  const hasConsent = useAnalyticsStore((state) => state.hasConsent);

  // Track pageviews on route change
  useEffect(() => {
    if (pathname && hasConsent && GA_TRACKING_ID) {
      const url =
        pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams, hasConsent]);

  // If no tracking ID or no consent, don't render the scripts at all
  if (!GA_TRACKING_ID || !hasConsent) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => {
          setInitialized(true);
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
