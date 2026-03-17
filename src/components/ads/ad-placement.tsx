"use client";

import { Suspense, lazy } from "react";

type AdLocation = "sidebar" | "article-bottom";

interface AdPlacementProps {
  location: AdLocation;
  className?: string;
}

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
const PROVIDER = process.env.NEXT_PUBLIC_AD_PROVIDER ?? "house";

const HEIGHT_MAP: Record<AdLocation, string> = {
  sidebar: "min-h-[250px]",
  "article-bottom": "min-h-[90px]",
};

const HouseAd = lazy(() =>
  import("./house-ad").then((m) => ({ default: m.HouseAd }))
);
const EthicalAd = lazy(() =>
  import("./ethical-ad").then((m) => ({ default: m.EthicalAd }))
);
const AdSenseAd = lazy(() =>
  import("./adsense-ad").then((m) => ({ default: m.AdSenseAd }))
);

function AdSkeleton({ minHeight }: { minHeight: string }) {
  return (
    <div
      className={`${minHeight} animate-pulse rounded-xl border border-border/40 bg-surface/30`}
    />
  );
}

function ProviderSwitch({ location }: { location: AdLocation }) {
  switch (PROVIDER) {
    case "adsense":
      return <AdSenseAd location={location} />;
    case "ethical":
      return <EthicalAd location={location} />;
    case "house":
    default:
      return <HouseAd location={location} />;
  }
}

/**
 * Generic ad wrapper. The only ad component the rest of the app imports.
 *
 * - Kill switch: returns null when NEXT_PUBLIC_ENABLE_ADS !== "true"
 * - CLS protection: reserves fixed min-height with skeleton while provider loads
 * - Provider agnostic: reads NEXT_PUBLIC_AD_PROVIDER to pick the right component
 */
export function AdPlacement({ location, className }: AdPlacementProps) {
  if (!ENABLED) return null;

  const minHeight = HEIGHT_MAP[location];

  return (
    <aside
      aria-label="Sponsored"
      className={`${minHeight} ${className ?? ""}`}
    >
      <Suspense fallback={<AdSkeleton minHeight={minHeight} />}>
        <ProviderSwitch location={location} />
      </Suspense>
    </aside>
  );
}
