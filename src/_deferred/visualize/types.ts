/**
 * PARKED (Phase 2 deferral).
 *
 * Self-contained type contracts for the deferred execution-visualization
 * feature. Originally these lived in `src/lib/playground/types.ts`, but the
 * visualization layer has been parked out of the active blog pipeline.
 *
 * Nothing in the live app imports this folder. It is preserved verbatim so the
 * data architecture (deterministic `staticAnalyze` + AI proxy contract) can be
 * revived later as a standalone, non-AI-first logic tracer.
 */

/** Languages the original visualizer understood. */
export type PlaygroundLanguage = "python" | "javascript";

/** A single node in the execution / memory diagram. */
export interface VizNode {
  id: string;
  label: string;
  kind: "variable" | "value" | "call" | "frame" | "note";
  detail?: string;
}

/** A directed relationship between two {@link VizNode}s. */
export interface VizEdge {
  from: string;
  to: string;
  label?: string;
}

/** One step of a step-through narration of the algorithm. */
export interface VizStep {
  line?: number;
  description: string;
  highlight?: string[];
}

/** The structured payload produced by the parked visualize route. */
export interface VizGraph {
  title: string;
  summary: string;
  nodes: VizNode[];
  edges: VizEdge[];
  steps: VizStep[];
  source: "ai" | "static";
}

/** Request body accepted by the parked visualize handler. */
export interface VisualizeRequest {
  code: string;
  language: PlaygroundLanguage;
  stdout?: string;
}

/** Hard limits enforced by the parked handler to bound cost & abuse. */
export const VISUALIZE_LIMITS = {
  maxCodeLength: 8_000,
  maxStdoutLength: 4_000,
} as const;
