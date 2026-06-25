"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Payload a snippet dispatches when the reader clicks "Run".
 */
export interface RunnerPayload {
  code: string;
  language: string;
  title?: string;
}

interface GlobalRunnerState {
  /** Whether the slide-out drawer is visible. */
  isOpen: boolean;
  /** Source currently loaded into the global editor. */
  code: string;
  /** Active registry language id. */
  language: string;
  /** Optional caption (the snippet's title). */
  title?: string;
  /**
   * Monotonic counter bumped on every `open()` dispatch. The drawer watches
   * this to know when a *new* snippet was sent (vs. a re-render) so it can
   * re-seed the editor and auto-run — even if the same code is dispatched twice.
   */
  token: number;
}

interface GlobalRunnerContextValue extends GlobalRunnerState {
  /** Load a snippet into the global editor and open the drawer. */
  open: (payload: RunnerPayload) => void;
  /** Close the drawer (editor + runtime stay mounted for reuse). */
  close: () => void;
}

const GlobalRunnerContext = createContext<GlobalRunnerContextValue | null>(null);

/**
 * `GlobalRunnerProvider` — owns the state of the single, page-level code
 * runner. Mounted once near the root so any `RunnableSnippet` on the page can
 * dispatch its code into one shared editor instead of hydrating its own.
 */
export function GlobalRunnerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GlobalRunnerState>({
    isOpen: false,
    code: "",
    language: "python",
    title: undefined,
    token: 0,
  });

  const open = useCallback((payload: RunnerPayload) => {
    setState((prev) => ({
      isOpen: true,
      code: payload.code,
      language: payload.language,
      title: payload.title,
      token: prev.token + 1,
    }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value = useMemo<GlobalRunnerContextValue>(
    () => ({ ...state, open, close }),
    [state, open, close]
  );

  return (
    <GlobalRunnerContext.Provider value={value}>
      {children}
    </GlobalRunnerContext.Provider>
  );
}

/** Access the global runner. Throws if used outside the provider. */
export function useGlobalRunner(): GlobalRunnerContextValue {
  const ctx = useContext(GlobalRunnerContext);
  if (!ctx) {
    throw new Error(
      "useGlobalRunner must be used within a <GlobalRunnerProvider>"
    );
  }
  return ctx;
}
