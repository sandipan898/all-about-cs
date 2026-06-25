"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { VizEdge, VizGraph, VizNode } from "@/lib/playground/types";

interface ExecutionVisualizerProps {
  graph: VizGraph | null;
  loading?: boolean;
}

// ── Layout constants ───────────────────────────────────────────────
const NODE_W = 132;
const NODE_H = 48;
const GAP_X = 56;
const GAP_Y = 40;
const PAD = 24;
const COLS = 4;

/** Visual treatment per node kind (uses theme tokens / Tailwind palette). */
const KIND_STYLE: Record<
  VizNode["kind"],
  { fill: string; stroke: string; text: string }
> = {
  variable: { fill: "fill-accent/10", stroke: "stroke-accent", text: "text-accent" },
  value: { fill: "fill-emerald-500/10", stroke: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  call: { fill: "fill-amber-500/10", stroke: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400" },
  frame: { fill: "fill-violet-500/10", stroke: "stroke-violet-500", text: "text-violet-600 dark:text-violet-400" },
  note: { fill: "fill-surface", stroke: "stroke-border", text: "text-muted" },
};

interface Positioned extends VizNode {
  x: number;
  y: number;
}

/**
 * Deterministic grid auto-layout. We intentionally avoid a force-directed
 * library: a wrapped grid is stable, dependency-free, and perfectly legible
 * for the small graphs (≈3–20 nodes) educational snippets produce.
 */
function layout(nodes: VizNode[]): {
  positioned: Positioned[];
  width: number;
  height: number;
} {
  const positioned = nodes.map((n, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      ...n,
      x: PAD + col * (NODE_W + GAP_X),
      y: PAD + row * (NODE_H + GAP_Y),
    };
  });
  const rows = Math.ceil(nodes.length / COLS) || 1;
  const cols = Math.min(nodes.length, COLS) || 1;
  return {
    positioned,
    width: PAD * 2 + cols * NODE_W + (cols - 1) * GAP_X,
    height: PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y,
  };
}

/** Center point of a positioned node. */
function center(n: Positioned) {
  return { cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 };
}

/**
 * `<ExecutionVisualizer />` — renders the structured {@link VizGraph} returned
 * by /api/visualize as an SVG node-and-edge diagram with a step-through
 * narration of the algorithm (recursion frames, variable state, etc.).
 */
export function ExecutionVisualizer({
  graph,
  loading,
}: ExecutionVisualizerProps) {
  const [step, setStep] = useState(0);

  const { positioned, width, height, nodeById } = useMemo(() => {
    if (!graph) return { positioned: [], width: 0, height: 0, nodeById: new Map() };
    const laid = layout(graph.nodes);
    return {
      ...laid,
      nodeById: new Map(laid.positioned.map((n) => [n.id, n])),
    };
  }, [graph]);

  if (loading && !graph) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted">
        <Sparkles className="h-4 w-4 animate-pulse text-accent" />
        Generating execution visualization…
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="px-4 py-6 text-sm text-muted">
        Could not generate a visualization for this snippet.
      </div>
    );
  }

  const steps = graph.steps ?? [];
  const active = steps[step];
  const highlighted = new Set(active?.highlight ?? []);

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">
          {graph.title}
        </span>
        <span className="ml-auto rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          {graph.source === "ai" ? "AI" : "static"}
        </span>
      </div>

      {graph.summary && (
        <p className="px-4 pt-3 text-sm text-muted">{graph.summary}</p>
      )}

      {/* Diagram */}
      <div className="overflow-auto px-4 py-4">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="max-w-full"
          role="img"
          aria-label={`Execution diagram: ${graph.title}`}
        >
          <defs>
            <marker
              id="viz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="fill-muted" />
            </marker>
          </defs>

          {/* Edges first so nodes paint on top */}
          {graph.edges.map((e: VizEdge, i) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;
            const { cx: x1, cy: y1 } = center(a);
            const { cx: x2, cy: y2 } = center(b);
            return (
              <g key={`e-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="stroke-border"
                  strokeWidth={1.5}
                  markerEnd="url(#viz-arrow)"
                />
                {e.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 4}
                    textAnchor="middle"
                    className="fill-muted text-[10px]"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {positioned.map((n) => {
            const s = KIND_STYLE[n.kind] ?? KIND_STYLE.note;
            const isHot = highlighted.has(n.id);
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  className={`${s.fill} ${s.stroke}`}
                  strokeWidth={isHot ? 2.5 : 1.5}
                  opacity={highlighted.size === 0 || isHot ? 1 : 0.4}
                />
                <text
                  x={n.x + NODE_W / 2}
                  y={n.y + (n.detail ? 19 : 28)}
                  textAnchor="middle"
                  className={`${s.text} text-[12px] font-medium`}
                >
                  {n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label}
                </text>
                {n.detail && (
                  <text
                    x={n.x + NODE_W / 2}
                    y={n.y + 34}
                    textAnchor="middle"
                    className="fill-muted text-[10px]"
                  >
                    {n.detail.length > 20 ? n.detail.slice(0, 19) + "…" : n.detail}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Step-through narration */}
      {steps.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 text-sm">
            <span className="mr-2 font-mono text-xs text-muted">
              {step + 1}/{steps.length}
              {active?.line ? ` · line ${active.line}` : ""}
            </span>
            <span className="text-foreground">{active?.description}</span>
          </div>

          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={step >= steps.length - 1}
            className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
            aria-label="Next step"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
