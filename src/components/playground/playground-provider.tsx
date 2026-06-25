"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  PlaygroundLanguage,
  RunResult,
  VizGraph,
} from "@/lib/playground/types";

/**
 * Per-instance state container shared between a `<LivePlayground />` editor
 * and its sibling `<ExecutionVisualizer />`.
 *
 * Why Context (and NOT a global store like Zustand):
 * a single tutorial page may render many independent playgrounds. Each must
 * own its own code/output/visualization, so we scope one provider per
 * playground instance — mirroring the existing DualModeProvider pattern.
 */
interface PlaygroundContextValue {
  language: PlaygroundLanguage;

  /** Current editor source (controlled). */
  code: string;
  setCode: (code: string) => void;

  /** Pristine source, used by the Reset action. */
  initialCode: string;
  reset: () => void;

  /** Most recent execution result (null before first run). */
  result: RunResult | null;
  setResult: (result: RunResult | null) => void;

  /** AI/static visualization graph (null until requested). */
  graph: VizGraph | null;
  setGraph: (graph: VizGraph | null) => void;

  /** Whether the visualizer panel is expanded. */
  showVisualizer: boolean;
  setShowVisualizer: (show: boolean) => void;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

interface PlaygroundProviderProps {
  children: ReactNode;
  language: PlaygroundLanguage;
  initialCode: string;
}

export function PlaygroundProvider({
  children,
  language,
  initialCode,
}: PlaygroundProviderProps) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const [graph, setGraph] = useState<VizGraph | null>(null);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const reset = useCallback(() => {
    setCode(initialCode);
    setResult(null);
    setGraph(null);
  }, [initialCode]);

  const value = useMemo<PlaygroundContextValue>(
    () => ({
      language,
      code,
      setCode,
      initialCode,
      reset,
      result,
      setResult,
      graph,
      setGraph,
      showVisualizer,
      setShowVisualizer,
    }),
    [language, code, initialCode, reset, result, graph, showVisualizer]
  );

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) {
    throw new Error("usePlayground must be used within a <PlaygroundProvider>");
  }
  return ctx;
}
