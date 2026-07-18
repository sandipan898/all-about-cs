// ⚠️ DEFERRED / NOT WIRED IN.
// This is the previous Google Analytics 4 loader, parked here intentionally.
// The active analytics tracker is Umami — see src/components/analytics.tsx.
//
// To re-enable GA4 later:
//   1. Move this file back to src/components/analytics.tsx (or import it).
//   2. Set NEXT_PUBLIC_GA_ID in your environment.
//   3. Mount <GoogleAnalytics /> in src/app/layout.tsx.

import Script from "next/script";

/**
 * Google Analytics 4 loader.
 *
 * Renders nothing unless `NEXT_PUBLIC_GA_ID` is set (e.g. "G-XXXXXXXXXX"),
 * so the site stays clean in local/dev and preview environments.
 *
 * Uses `strategy="afterInteractive"` so the tag never blocks first paint or
 * the server-rendered HTML that search/AI crawlers read.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
