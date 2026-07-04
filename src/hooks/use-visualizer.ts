"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Frame,
  PlaybackState,
  SpeedLabel,
  AlgorithmDef,
} from "@/lib/visualizer/types";
import { SPEED_PRESETS } from "@/lib/visualizer/types";

interface UseVisualizerReturn {
  /** All frames for the current algorithm + input. */
  frames: Frame[];
  /** Current frame index. */
  currentFrame: number;
  /** Current playback state. */
  playback: PlaybackState;
  /** Current speed label. */
  speed: SpeedLabel;
  /** Total number of frames. */
  totalFrames: number;
  /** Start/resume playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Step forward one frame. */
  stepForward: () => void;
  /** Step backward one frame. */
  stepBackward: () => void;
  /** Jump to a specific frame. */
  goToFrame: (index: number) => void;
  /** Reset to frame 0. */
  reset: () => void;
  /** Change playback speed. */
  setSpeed: (speed: SpeedLabel) => void;
  /** Regenerate frames with new input. */
  setInput: (input: number[]) => void;
  /** Current input array. */
  input: number[];
}

/**
 * `useVisualizer` — the animation controller hook.
 *
 * Takes an AlgorithmDef, generates frames from the input, and provides
 * play/pause/step controls with configurable speed. The animation loop
 * uses requestAnimationFrame with a timestamp-based frame advance to
 * ensure smooth playback regardless of tab focus or frame drops.
 */
export function useVisualizer(algorithm: AlgorithmDef): UseVisualizerReturn {
  const [input, setInputState] = useState<number[]>(algorithm.defaultInput);
  const [frames, setFrames] = useState<Frame[]>(() =>
    algorithm.generateFrames(algorithm.defaultInput)
  );
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [speed, setSpeed] = useState<SpeedLabel>("normal");

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const playbackRef = useRef(playback);
  const speedRef = useRef(speed);
  const currentFrameRef = useRef(currentFrame);
  const framesRef = useRef(frames);

  // Keep refs in sync.
  playbackRef.current = playback;
  speedRef.current = speed;
  currentFrameRef.current = currentFrame;
  framesRef.current = frames;

  // Regenerate frames when algorithm changes.
  useEffect(() => {
    const newFrames = algorithm.generateFrames(input);
    setFrames(newFrames);
    setCurrentFrame(0);
    setPlayback("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm.id]);

  // Animation loop.
  const tick = useCallback((timestamp: number) => {
    if (playbackRef.current !== "playing") return;

    const elapsed = timestamp - lastTickRef.current;
    const interval = SPEED_PRESETS[speedRef.current];

    if (elapsed >= interval) {
      lastTickRef.current = timestamp;
      const next = currentFrameRef.current + 1;
      if (next >= framesRef.current.length) {
        setPlayback("finished");
        setCurrentFrame(framesRef.current.length - 1);
        return;
      }
      setCurrentFrame(next);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop the animation loop based on playback state.
  useEffect(() => {
    if (playback === "playing") {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playback, tick]);

  const play = useCallback(() => {
    if (currentFrameRef.current >= framesRef.current.length - 1) {
      // If at end, restart.
      setCurrentFrame(0);
    }
    setPlayback("playing");
  }, []);

  const pause = useCallback(() => setPlayback("paused"), []);

  const stepForward = useCallback(() => {
    setPlayback("paused");
    setCurrentFrame((prev) => Math.min(prev + 1, framesRef.current.length - 1));
  }, []);

  const stepBackward = useCallback(() => {
    setPlayback("paused");
    setCurrentFrame((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToFrame = useCallback((index: number) => {
    setPlayback("paused");
    setCurrentFrame(Math.max(0, Math.min(index, framesRef.current.length - 1)));
  }, []);

  const reset = useCallback(() => {
    setPlayback("idle");
    setCurrentFrame(0);
  }, []);

  const setSpeedCb = useCallback((s: SpeedLabel) => setSpeed(s), []);

  const setInput = useCallback(
    (newInput: number[]) => {
      setInputState(newInput);
      const newFrames = algorithm.generateFrames(newInput);
      setFrames(newFrames);
      setCurrentFrame(0);
      setPlayback("idle");
    },
    [algorithm]
  );

  return {
    frames,
    currentFrame,
    playback,
    speed,
    totalFrames: frames.length,
    play,
    pause,
    stepForward,
    stepBackward,
    goToFrame,
    reset,
    setSpeed: setSpeedCb,
    setInput,
    input,
  };
}
