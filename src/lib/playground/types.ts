/**
 * Shared type contracts for the Interactive Sandbox (Phase 2).
 *
 * These types are framework-agnostic (no React / DOM imports) so they can be
 * consumed by:
 *   - client components (LivePlayground, ExecutionVisualizer),
 *   - the Wasm runner hook,
 *   - and the server-side /api/visualize route.
 *
 * Keeping them in one place guarantees the code → execution → visualization
 * pipeline speaks a single, strongly-typed language end to end.
 */

/** Languages the sandbox can execute entirely client-side. */
export type PlaygroundLanguage = "python" | "javascript";

/** Lifecycle of the underlying Wasm / Worker runtime. */
export type RunnerStatus =
  | "idle" // runtime not requested yet
  | "loading" // runtime is downloading / booting
  | "ready" // runtime booted, awaiting input
  | "running" // user code currently executing
  | "error"; // runtime failed to initialize

/** Normalized result of a single code execution. */
export interface RunResult {
  /** Captured standard output (joined). */
  stdout: string;
  /** Captured standard error / exception text. */
  stderr: string;
  /** Wall-clock execution time in milliseconds. */
  durationMs: number;
  /** True when execution completed without throwing. */
  ok: boolean;
}

// ── AI Visualization contract ──────────────────────────────────────

/** A single node in the execution / memory diagram. */
export interface VizNode {
  id: string;
  /** Short human label, e.g. `n = 5` or `factorial(3)`. */
  label: string;
  /** Semantic category — drives shape & color in the renderer. */
  kind: "variable" | "value" | "call" | "frame" | "note";
  /** Optional secondary text (current value, type, etc.). */
  detail?: string;
}

/** A directed relationship between two {@link VizNode}s. */
export interface VizEdge {
  from: string;
  to: string;
  /** Optional edge caption, e.g. `returns` or `points to`. */
  label?: string;
}

/** One step of a step-through narration of the algorithm. */
export interface VizStep {
  /** 1-based source line this step refers to, if known. */
  line?: number;
  /** Plain-language description of what happens at this step. */
  description: string;
  /** Node ids to emphasize while this step is active. */
  highlight?: string[];
}

/**
 * The structured payload returned by /api/visualize and rendered by
 * {@link import("@/components/playground/execution-visualizer")}.
 */
export interface VizGraph {
  title: string;
  summary: string;
  nodes: VizNode[];
  edges: VizEdge[];
  steps: VizStep[];
  /** "ai" when produced by the LLM, "static" when produced by the fallback. */
  source: "ai" | "static";
}

/** Request body accepted by POST /api/visualize. */
export interface VisualizeRequest {
  code: string;
  language: PlaygroundLanguage;
  /** Optional captured stdout to give the model runtime grounding. */
  stdout?: string;
}

/** Hard limits enforced by the API route to bound cost & abuse. */
export const VISUALIZE_LIMITS = {
  /** Max accepted source length (characters). */
  maxCodeLength: 8_000,
  /** Max accepted stdout length (characters). */
  maxStdoutLength: 4_000,
} as const;
