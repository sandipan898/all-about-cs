"use client";

import { useState, useCallback } from "react";
import { useVisualizer } from "@/hooks/use-visualizer";
import { ALGORITHMS, getAlgorithm } from "@/lib/visualizer/registry";
import { ArrayBars } from "@/components/visualizer/array-bars";
import { CodePanel } from "@/components/visualizer/code-panel";
import { Controls } from "@/components/visualizer/controls";
import { Legend } from "@/components/visualizer/legend";
import { AlgorithmSelector } from "@/components/visualizer/algorithm-selector";
import { Shuffle } from "lucide-react";

export function VisualizerClient() {
  const [algorithmId, setAlgorithmId] = useState(ALGORITHMS[0].id);
  const algorithm = getAlgorithm(algorithmId) ?? ALGORITHMS[0];

  const {
    frames,
    currentFrame,
    playback,
    speed,
    totalFrames,
    play,
    pause,
    stepForward,
    stepBackward,
    goToFrame,
    reset,
    setSpeed,
    setInput,
    input,
  } = useVisualizer(algorithm);

  const frame = frames[currentFrame];

  const [customInput, setCustomInput] = useState(input.join(", "));

  const handleAlgorithmChange = useCallback((id: string) => {
    setAlgorithmId(id);
    const algo = getAlgorithm(id);
    if (algo) setCustomInput(algo.defaultInput.join(", "));
  }, []);

  const randomize = useCallback(() => {
    const size = 8 + Math.floor(Math.random() * 5); // 8-12 elements
    const arr = Array.from(
      { length: size },
      () => Math.floor(Math.random() * 95) + 5,
    );
    setInput(arr);
    setCustomInput(arr.join(", "));
  }, [setInput]);

  const applyCustomInput = useCallback(() => {
    const parsed = customInput
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0 && n < 200);
    if (parsed.length >= 2) {
      setInput(parsed);
    }
  }, [customInput, setInput]);

  return (
    <div className="space-y-6">
      {/* Header row: algorithm name + selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {algorithm.name}
            <span className="ml-2 inline-block align-middle rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
              {algorithm.category}
            </span>
          </h2>
          <p className="max-w-xl text-sm text-muted">{algorithm.description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground">
              <span className="text-muted">Time:</span>{" "}
              {algorithm.timeComplexity}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover px-2 py-0.5 text-xs font-medium text-foreground">
              <span className="text-muted">Space:</span>{" "}
              {algorithm.spaceComplexity}
            </span>
          </div>
        </div>
        <div className="w-full shrink-0 lg:w-[480px]">
          <h5 className="text-lg font-bold tracking-tight text-foreground sm:text-lg mb-2">
            Select Algorithms
          </h5>
          <AlgorithmSelector
            selected={algorithm}
            onSelect={handleAlgorithmChange}
          />
        </div>
      </div>

      {/* Main content: visualization + code side by side, aligned at top */}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_480px]">
        {/* Left: Visualization area */}
        <div className="min-w-0 space-y-4">
          {/* Array bars */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <ArrayBars frame={frame} />
          </div>

          {/* Step description */}
          <div className="rounded-lg border border-border bg-surface-hover px-4 py-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold text-accent">
                Step {currentFrame + 1}:
              </span>{" "}
              {frame.description}
            </p>
          </div>

          {/* Controls */}
          <div className="rounded-lg border border-border bg-surface px-4 py-4">
            <Controls
              playback={playback}
              speed={speed}
              currentFrame={currentFrame}
              totalFrames={totalFrames}
              onPlay={play}
              onPause={pause}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onReset={reset}
              onSpeedChange={setSpeed}
              onFrameChange={goToFrame}
            />
          </div>

          {/* Input customization */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCustomInput()}
              placeholder="e.g. 64, 34, 25, 12, 22, 11"
              className="min-w-[200px] flex-1 rounded-md border border-border bg-surface-hover px-3 py-1.5 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Custom array input"
            />
            <button
              type="button"
              onClick={applyCustomInput}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={randomize}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Randomize
            </button>
          </div>

          {/* Legend */}
          <Legend />
        </div>

        {/* Right: Code panel */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
          <CodePanel code={algorithm.code} activeLine={frame.codeLine} />
        </div>
      </div>
    </div>
  );
}
