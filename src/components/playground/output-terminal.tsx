"use client";

import type { RunResult } from "@/lib/playground/types";

interface OutputTerminalProps {
  result: RunResult | null;
  /** True while code is executing (shows a running indicator). */
  busy?: boolean;
}

/**
 * Read-only console that renders captured stdout / stderr from the runner.
 * stderr is colored red; an exit summary line shows status + duration.
 */
export function OutputTerminal({ result, busy }: OutputTerminalProps) {
  return (
    <div className="flex min-h-[8rem] flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Output
        </span>
        {result && !busy && (
          <span
            className={`text-xs font-medium ${
              result.ok ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {result.ok ? "✓ finished" : "✗ error"} · {result.durationMs} ms
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-[1.6]">
        {busy ? (
          <span className="text-muted">Running…</span>
        ) : !result ? (
          <span className="text-muted">
            Press <kbd className="rounded bg-surface px-1">Run</kbd> to execute
            the code.
          </span>
        ) : (
          <>
            {result.stdout && (
              <pre className="m-0 whitespace-pre-wrap break-words text-foreground">
                {result.stdout}
              </pre>
            )}
            {result.stderr && (
              <pre className="m-0 whitespace-pre-wrap break-words text-red-500">
                {result.stderr}
              </pre>
            )}
            {!result.stdout && !result.stderr && (
              <span className="text-muted">
                (no output — nothing was printed)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
