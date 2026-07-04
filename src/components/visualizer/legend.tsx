"use client";

import type { ElementState } from "@/lib/visualizer/types";

const LEGEND_ITEMS: { state: ElementState; label: string; color: string }[] = [
  { state: "default", label: "Default", color: "#6366f1" },
  { state: "comparing", label: "Comparing", color: "#f59e0b" },
  { state: "swapping", label: "Swapping", color: "#ef4444" },
  { state: "sorted", label: "Sorted", color: "#22c55e" },
  { state: "pivot", label: "Pivot", color: "#a855f7" },
  { state: "found", label: "Found", color: "#22c55e" },
  { state: "active", label: "Active", color: "#3b82f6" },
];

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {LEGEND_ITEMS.map(({ state, label, color }) => (
        <div key={state} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
