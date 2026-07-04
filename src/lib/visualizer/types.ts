/**
 * DSA Visualizer — Core Types
 *
 * Framework-agnostic type contracts for the step-based animation engine.
 * Each algorithm is a pure function producing Frame[], and a generic renderer
 * draws those frames with play/pause/step controls.
 */

/** Visual state of an individual array element in a frame. */
export type ElementState =
  | "default"
  | "comparing"
  | "swapping"
  | "sorted"
  | "pivot"
  | "found"
  | "active"
  | "left-partition"
  | "right-partition"
  | "merged";

/** A single animation frame (one "step" of the algorithm). */
export interface Frame {
  /** The array state at this step. */
  array: number[];
  /** Map of index → visual state for highlighted elements. */
  highlights: Record<number, ElementState>;
  /** Human-readable description of what's happening at this step. */
  description: string;
  /** Which line of the algorithm source to highlight (0-indexed). */
  codeLine: number;
  /** Optional: pointers/markers (e.g., "i", "j", "left", "right", "mid"). */
  pointers?: Record<string, number>;
}

/** Algorithm category for grouping in the UI. */
export type AlgorithmCategory = "sorting" | "searching" | "technique";

/** Definition of a visualizable algorithm. */
export interface AlgorithmDef {
  /** Unique identifier (used in URL params). */
  id: string;
  /** Display name. */
  name: string;
  /** Category for tab grouping. */
  category: AlgorithmCategory;
  /** The algorithm's source code (shown in code panel). */
  code: string;
  /** Pure function: takes input array → returns all animation frames. */
  generateFrames: (input: number[]) => Frame[];
  /** Default sample input. */
  defaultInput: number[];
  /** Time complexity (e.g., "O(n²)"). */
  timeComplexity: string;
  /** Space complexity (e.g., "O(1)"). */
  spaceComplexity: string;
  /** One-line description. */
  description: string;
}

/** Playback state for the animation controller. */
export type PlaybackState = "idle" | "playing" | "paused" | "finished";

/** Speed presets (ms per frame). */
export const SPEED_PRESETS = {
  slow: 1000,
  normal: 500,
  fast: 200,
  instant: 50,
} as const;

export type SpeedLabel = keyof typeof SPEED_PRESETS;
