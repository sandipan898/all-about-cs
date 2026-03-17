"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface AdSenseAdProps {
  location: "sidebar" | "article-bottom";
}

const SLOT_MAP: Record<string, string> = {
  sidebar: "0000000001",
  "article-bottom": "0000000002",
};

export function AdSenseAd({ location }: AdSenseAdProps) {
  const pushed = useRef(false);
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    if (pushed.current || !adClientId) return;
    pushed.current = true;

    try {
      const w = window as unknown as Record<string, unknown>;
      const adsbygoogle = (w.adsbygoogle ??= []) as unknown[];
      adsbygoogle.push({});
    } catch {
      // Ad blocker or script failure — fail silently
    }
  }, [adClientId]);

  if (!adClientId) return null;

  return (
    <>
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClientId}
        data-ad-slot={SLOT_MAP[location] ?? SLOT_MAP.sidebar}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
