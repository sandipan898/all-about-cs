"use client";

import { BookOpen, Play } from "lucide-react";
import { useDualMode } from "./dual-mode-provider";

export function DualModeToggle() {
  const { mode, toggle } = useDualMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${mode === "read" ? "watch" : "read"} mode`}
      className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-all hover:border-primary/40 hover:bg-surface-hover"
    >
      {/* Pill indicator */}
      <span className="relative flex h-6 w-11 items-center rounded-full bg-border transition-colors data-[active=true]:bg-primary/30">
        <span
          data-active={mode === "watch"}
          className="absolute left-0.5 h-5 w-5 rounded-full bg-muted shadow-sm transition-all duration-300 data-[active=true]:left-[22px] data-[active=true]:bg-primary"
        />
      </span>

      {/* Label */}
      <span className="flex items-center gap-1.5">
        {mode === "read" ? (
          <>
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span>Read Mode</span>
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 text-primary" />
            <span>Watch Mode</span>
          </>
        )}
      </span>
    </button>
  );
}
