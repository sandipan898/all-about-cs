"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface EthicalAdProps {
  location: "sidebar" | "article-bottom";
}

export function EthicalAd({ location }: EthicalAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded && containerRef.current) {
      try {
        // EthicalAds auto-detects divs with data-ea-publisher after script loads
        const w = window as unknown as Record<string, unknown>;
        (w.ethicalads as { load?: () => void })?.load?.();
      } catch {
        // Ad blocker or script failure — fail silently
      }
    }
  }, [loaded]);

  const adType = location === "sidebar" ? "image" : "text";

  return (
    <>
      <Script
        src="https://media.ethicalads.io/media/client/ethicalads.min.js"
        strategy="lazyOnload"
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Ad blocker or network failure — component stays as skeleton
        }}
      />
      <div
        ref={containerRef}
        className={adType === "image" ? "horizontal" : ""}
        data-ea-publisher="allaboutcs"
        data-ea-type={adType}
        data-ea-style="stickybox"
      />
    </>
  );
}
