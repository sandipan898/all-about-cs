"use client";

import { X, Maximize2 } from "lucide-react";
import { useDualMode } from "./dual-mode-provider";

interface YouTubeEmbedProps {
  id: string;
  title?: string;
}

export function YouTubeEmbed({ id, title = "Video" }: YouTubeEmbedProps) {
  const { mode, setMode } = useDualMode();

  const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

  // ── Read Mode: collapsed card that invites the user to switch ──
  if (mode === "read") {
    return (
      <div className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-surface">
        <button
          type="button"
          onClick={() => setMode("watch")}
          className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-hover"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video w-28 flex-shrink-0 overflow-hidden rounded-lg bg-border sm:w-36">
            <img
              src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
              alt={`Thumbnail for ${title}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-primary-foreground"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Switch to <span className="text-primary font-medium">Watch Mode</span> to follow along
            </p>
          </div>

          <Maximize2 className="h-4 w-4 flex-shrink-0 text-muted transition-colors group-hover:text-primary" />
        </button>
      </div>
    );
  }

  // ── Watch Mode: sticky video player ──
  return (
    <div className="not-prose sticky top-20 z-30">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/30">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
          <span className="text-xs font-medium text-muted truncate pr-2">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setMode("read")}
            aria-label="Close video and switch to read mode"
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Iframe */}
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
