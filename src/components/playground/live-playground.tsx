"use client";

import { useCallback, useState } from "react";
import { Play, RotateCcw, Workflow, Loader2 } from "lucide-react";
import {
  PlaygroundProvider,
  usePlayground,
} from "./playground-provider";
import { CodeEditor } from "./code-editor";
import { OutputTerminal } from "./output-terminal";
import { ExecutionVisualizer } from "./execution-visualizer";
import { useWasmRunner } from "@/hooks/use-wasm-runner";
import type {
  PlaygroundLanguage,
  VizGraph,
} from "@/lib/playground/types";

interface LivePlaygroundProps {
  /** Source code to seed the editor with. */
  code: string;
  /** Execution language. Defaults to Python (the dominant content category). */
  language?: PlaygroundLanguage;
  /** Optional heading shown in the card chrome. */
  title?: string;
  /** Hide the "Visualize" affordance for snippets that don't benefit from it. */
  visualize?: boolean;
}

/**
 * `<LivePlayground />` — the interactive code block that replaces static
 * fenced code in MDX. Drop it into a tutorial:
 *
 * ```mdx
 * <LivePlayground language="python" code={`print("hello")`} />
 * ```
 *
 * It is a self-contained client island: the heavy Wasm runtime only loads in
 * the browser, so server rendering (RSC/SSG) of the surrounding article is
 * never affected.
 */
export function LivePlayground({
  code,
  language = "python",
  title,
  visualize = true,
}: LivePlaygroundProps) {
  // `code` may arrive undefined if an author omits it; never crash the page.
  const initialCode = (code ?? "").trim();
  return (
    <PlaygroundProvider language={language} initialCode={initialCode}>
      <PlaygroundShell title={title} allowVisualize={visualize} />
    </PlaygroundProvider>
  );
}

function PlaygroundShell({
  title,
  allowVisualize,
}: {
  title?: string;
  allowVisualize: boolean;
}) {
  const {
    language,
    code,
    setCode,
    reset,
    result,
    setResult,
    graph,
    setGraph,
    showVisualizer,
    setShowVisualizer,
  } = usePlayground();

  const { run, isRunning, status, error } = useWasmRunner(language);
  const [visualizing, setVisualizing] = useState(false);
  const booting = status === "loading";

  const handleRun = useCallback(async () => {
    const next = await run(code);
    setResult(next);
  }, [run, code, setResult]);

  const handleVisualize = useCallback(async () => {
    setShowVisualizer(true);
    setVisualizing(true);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          stdout: result?.stdout?.slice(0, 4000),
        }),
      });
      if (!res.ok) throw new Error(`Visualizer responded ${res.status}`);
      const data = (await res.json()) as VizGraph;
      setGraph(data);
    } catch {
      setGraph(null);
    } finally {
      setVisualizing(false);
    }
  }, [code, language, result, setGraph, setShowVisualizer]);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
            {language}
          </span>
          {title && (
            <span className="text-sm font-medium text-foreground">{title}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {allowVisualize && (
            <button
              type="button"
              onClick={handleVisualize}
              disabled={visualizing}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-60"
            >
              {visualizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Workflow className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Visualize</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || booting || status === "error"}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isRunning || booting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {booting ? "Booting…" : isRunning ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      {/* ── Editor ────────────────────────────────────────────── */}
      <CodeEditor
        value={code}
        language={language}
        onChange={setCode}
        disabled={isRunning}
      />

      {/* ── Output ────────────────────────────────────────────── */}
      <div className="border-t border-border">
        {status === "error" ? (
          <div className="px-4 py-3 font-mono text-[13px] text-red-500">
            {error ?? "The execution runtime failed to load."}
          </div>
        ) : (
          <OutputTerminal result={result} busy={isRunning} />
        )}
      </div>

      {/* ── AI Visualizer (collapsible) ───────────────────────── */}
      {showVisualizer && (
        <div className="border-t border-border">
          <ExecutionVisualizer graph={graph} loading={visualizing} />
        </div>
      )}
    </div>
  );
}
