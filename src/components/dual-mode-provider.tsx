"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ViewMode = "read" | "watch";

interface DualModeContextValue {
  mode: ViewMode;
  toggle: () => void;
  setMode: (mode: ViewMode) => void;
}

const DualModeContext = createContext<DualModeContextValue | null>(null);

export function DualModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("read");

  const toggle = useCallback(
    () => setMode((prev) => (prev === "read" ? "watch" : "read")),
    []
  );

  return (
    <DualModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </DualModeContext.Provider>
  );
}

export function useDualMode() {
  const ctx = useContext(DualModeContext);
  if (!ctx) {
    throw new Error("useDualMode must be used within a <DualModeProvider>");
  }
  return ctx;
}
