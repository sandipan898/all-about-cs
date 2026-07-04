"use client";

import type { Frame, ElementState } from "@/lib/visualizer/types";

const STATE_COLORS: Record<ElementState, string> = {
  default: "var(--color-accent, #6366f1)",
  comparing: "#f59e0b", // amber
  swapping: "#ef4444", // red
  sorted: "#22c55e", // green
  pivot: "#a855f7", // purple
  found: "#22c55e", // green
  active: "#3b82f6", // blue
  "left-partition": "#06b6d4", // cyan
  "right-partition": "#f97316", // orange
  merged: "#10b981", // emerald
};

interface ArrayBarsProps {
  frame: Frame;
}

/**
 * `ArrayBars` — SVG-based array bar chart renderer.
 *
 * Each bar's height is proportional to its value. Colors are driven by the
 * frame's `highlights` map. CSS transitions on `height`, `fill`, and `y`
 * produce smooth animations between frames without requestAnimationFrame
 * rendering — just React state updates + browser compositor.
 */
export function ArrayBars({ frame }: ArrayBarsProps) {
  const { array, highlights, pointers } = frame;
  const maxVal = Math.max(...array, 1);
  const count = array.length;

  // Responsive: bars fill the container, with small gaps
  const barGap = 2;
  const svgHeight = 280;
  const labelHeight = 28;
  const totalHeight = svgHeight + labelHeight;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${count * 40 + (count - 1) * barGap} ${totalHeight}`}
        className="h-[240px] w-full sm:h-[280px]"
        preserveAspectRatio="xMidYMax meet"
        role="img"
        aria-label="Array visualization"
      >
        {array.map((value, i) => {
          const state = highlights[i] ?? "default";
          const barWidth = 40;
          const barMaxHeight = svgHeight - 20; // leave room for value label above
          const barHeight = Math.max((value / maxVal) * barMaxHeight, 4);
          const x = i * (barWidth + barGap);
          const y = svgHeight - barHeight;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={STATE_COLORS[state]}
                style={{
                  transition: "y 300ms ease, height 300ms ease, fill 200ms ease",
                }}
              />
              {/* Value label above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium"
                style={{ transition: "y 300ms ease" }}
              >
                {value}
              </text>
              {/* Index label below bar */}
              <text
                x={x + barWidth / 2}
                y={svgHeight + 16}
                textAnchor="middle"
                className="fill-muted text-[10px]"
              >
                {i}
              </text>
            </g>
          );
        })}

        {/* Pointer markers */}
        {pointers &&
          Object.entries(pointers).map(([label, idx]) => {
            if (idx < 0 || idx >= count) return null;
            const barWidth = 40;
            const x = idx * (barWidth + barGap) + barWidth / 2;
            return (
              <text
                key={label}
                x={x}
                y={totalHeight - 2}
                textAnchor="middle"
                className="fill-accent text-[9px] font-bold"
              >
                {label}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
