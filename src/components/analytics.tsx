import Script from "next/script";

/**
 * Umami analytics loader (self-hosted, privacy-first, cookieless).
 *
 * Renders nothing unless BOTH env vars are set, so the site stays clean in
 * local/dev and preview environments — no tracking noise, no consent banner
 * needed.
 *
 *   NEXT_PUBLIC_UMAMI_SRC         e.g. https://analytics.allaboutcs.dev/script.js
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID  the website UUID from your Umami dashboard
 *
 * Uses `strategy="afterInteractive"` so the ~2 KB tracker never blocks first
 * paint or the server-rendered HTML that search/AI crawlers read. Umami tracks
 * SPA route changes automatically — no extra wiring required.
 *
 * (The previous Google Analytics loader is parked in
 *  src/_deferred/analytics/ga.tsx and is intentionally not wired in.)
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!src || !websiteId) return null;

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
