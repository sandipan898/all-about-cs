"use client";

import { type ReactNode } from "react";
import { DualModeProvider, useDualMode } from "./dual-mode-provider";
import { DualModeToggle } from "./dual-mode-toggle";
import { YouTubeEmbed } from "./youtube-embed";
import { AdPlacement } from "./ads/ad-placement";

interface DualModeLayoutProps {
  children: ReactNode;
  youtubeId: string;
  videoTitle?: string;
}

export function DualModeLayout({
  children,
  youtubeId,
  videoTitle,
}: DualModeLayoutProps) {
  return (
    <DualModeProvider>
      <DualModeInner youtubeId={youtubeId} videoTitle={videoTitle}>
        {children}
      </DualModeInner>
    </DualModeProvider>
  );
}

const proseClasses =
  "prose prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-img:rounded-xl";

function DualModeInner({
  children,
  youtubeId,
  videoTitle,
}: DualModeLayoutProps) {
  const { mode } = useDualMode();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex justify-end">
        <DualModeToggle />
      </div>

      {mode === "read" ? (
        /* ── Read Mode: content center + optional sidebar ── */
        <div className="grid gap-10 xl:grid-cols-[1fr_240px]">
          <div>
            <article className={`${proseClasses} mx-auto max-w-3xl xl:mx-0`}>
              {children}
            </article>

            {/* Article-bottom ad — after content, outside prose */}
            <div className="mx-auto mt-12 max-w-3xl xl:mx-0">
              <AdPlacement location="article-bottom" />
            </div>
          </div>

          {/* Desktop sidebar — hidden below xl */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <AdPlacement location="sidebar" />
            </div>
          </aside>
        </div>
      ) : (
        /* ── Watch Mode: two-column split ── */
        <div>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <YouTubeEmbed id={youtubeId} title={videoTitle} />
            </div>
            <article className={`${proseClasses} max-w-none`}>
              {children}
            </article>
          </div>

          {/* Article-bottom ad — full width below split */}
          <div className="mx-auto mt-12 max-w-3xl">
            <AdPlacement location="article-bottom" />
          </div>
        </div>
      )}
    </div>
  );
}
