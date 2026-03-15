"use client";

import { type ReactNode } from "react";
import { DualModeProvider, useDualMode } from "./dual-mode-provider";
import { DualModeToggle } from "./dual-mode-toggle";
import { YouTubeEmbed } from "./youtube-embed";

interface DualModeLayoutProps {
  children: ReactNode;
  youtubeId: string;
  videoTitle?: string;
}

/**
 * Wraps a tutorial page with the dual-mode experience.
 * - Read Mode:  single centered column; video is a collapsed card inline.
 * - Watch Mode: two-column split; video sticks to the left, prose scrolls right.
 */
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

function DualModeInner({
  children,
  youtubeId,
  videoTitle,
}: DualModeLayoutProps) {
  const { mode } = useDualMode();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Toggle bar — always visible */}
      <div className="mb-6 flex justify-end">
        <DualModeToggle />
      </div>

      {mode === "read" ? (
        /* ── Read Mode: single column ── */
        <article className="prose prose-invert mx-auto max-w-3xl prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-surface prose-img:rounded-xl">
          {children}
        </article>
      ) : (
        /* ── Watch Mode: two-column split ── */
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left: sticky video */}
          <div>
            <YouTubeEmbed id={youtubeId} title={videoTitle} />
          </div>

          {/* Right: scrollable prose */}
          <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-surface prose-img:rounded-xl">
            {children}
          </article>
        </div>
      )}
    </div>
  );
}
