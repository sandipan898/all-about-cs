"use client";

import { Youtube, Mail } from "lucide-react";

export type AdLocation = "sidebar" | "article-bottom";

interface HouseAdProps {
  location: AdLocation;
}

export function HouseAd({ location }: HouseAdProps) {
  const isCompact = location === "sidebar";

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/60 bg-surface/60 backdrop-blur-sm ${
        isCompact ? "p-4" : "p-6"
      }`}
    >
      <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted/60">
        From the team
      </p>

      {/* YouTube promo */}
      <div className={`flex gap-4 ${isCompact ? "flex-col" : "items-center"}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <Youtube className="h-5 w-5 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Watch on YouTube
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Video walkthroughs of every tutorial — subscribe for weekly uploads.
          </p>
        </div>
      </div>

      <div className={`mt-4 flex gap-2 ${isCompact ? "flex-col" : ""}`}>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
        >
          <Youtube className="h-3.5 w-3.5" />
          Subscribe
        </a>
        <a
          href="/newsletter"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" />
          Newsletter
        </a>
      </div>
    </div>
  );
}
