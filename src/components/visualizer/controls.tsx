"use client";

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from "lucide-react";
import type { PlaybackState, SpeedLabel } from "@/lib/visualizer/types";

interface ControlsProps {
  playback: PlaybackState;
  speed: SpeedLabel;
  currentFrame: number;
  totalFrames: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: SpeedLabel) => void;
  onFrameChange: (frame: number) => void;
}

const SPEED_OPTIONS: { label: string; value: SpeedLabel }[] = [
  { label: "0.5x", value: "slow" },
  { label: "1x", value: "normal" },
  { label: "2x", value: "fast" },
  { label: "4x", value: "instant" },
];

/**
 * `Controls` — playback controls for the visualizer.
 *
 * Play/Pause, step forward/backward, speed selector, progress slider,
 * and reset. Fully keyboard-accessible.
 */
export function Controls({
  playback,
  speed,
  currentFrame,
  totalFrames,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
  onFrameChange,
}: ControlsProps) {
  const isPlaying = playback === "playing";
  const isFinished = playback === "finished";

  return (
    <div className="space-y-3">
      {/* Main controls row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onStepBackward}
          disabled={currentFrame === 0}
          aria-label="Step backward"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform hover:scale-105 hover:bg-primary active:scale-95"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onStepForward}
          disabled={currentFrame >= totalFrames - 1}
          aria-label="Step forward"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Speed selector */}
        <div className="ml-2 flex items-center gap-1 rounded-lg border border-border p-0.5">
          <Gauge className="ml-1.5 h-3.5 w-3.5 text-muted" />
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSpeedChange(opt.value)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                speed === opt.value
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-1">
        <span className="min-w-[3.5rem] text-right text-xs tabular-nums text-muted">
          {currentFrame + 1} / {totalFrames}
        </span>
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrame}
          onChange={(e) => onFrameChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-accent"
          aria-label="Frame progress"
        />
        <span className="text-xs text-muted">
          {isFinished ? "Done" : isPlaying ? "Playing" : "Paused"}
        </span>
      </div>
    </div>
  );
}
