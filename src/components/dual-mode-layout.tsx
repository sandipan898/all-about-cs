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
  "prose max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-img:rounded-xl prose-pre:overflow-x-auto";

function DualModeInner({
  children,
  youtubeId,
  videoTitle,
}: DualModeLayoutProps) {
  const { mode } = useDualMode();

  return (
    <div className="mx-auto max-w-6xl overflow-hidden px-4 py-8 sm:px-6">
      <div className="mb-6 flex justify-end">
        <DualModeToggle />
      </div>

      {mode === "read" ? (
        <div className="grid gap-10 xl:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <article className={`${proseClasses} mx-auto max-w-3xl xl:mx-0`}>
              {children}
            </article>

            <div className="mx-auto mt-12 max-w-3xl xl:mx-0">
              <AdPlacement location="article-bottom" />
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <AdPlacement location="sidebar" />
            </div>
          </aside>
        </div>
      ) : (
        <div>
          {/* Mobile: video stacked on top, not sticky */}
          <div className="mb-6 lg:hidden">
            <YouTubeEmbed id={youtubeId} title={videoTitle} />
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Desktop: sticky sidebar video */}
            <div className="hidden lg:block">
              <YouTubeEmbed id={youtubeId} title={videoTitle} />
            </div>

            <div className="min-w-0">
              <article className={proseClasses}>{children}</article>

              <div className="mt-12">
                <AdPlacement location="article-bottom" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
