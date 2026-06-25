"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Play, RotateCcw, Loader2, X } from "lucide-react";
import { getLanguage } from "@/lib/playground/languages";
import { useCodeRunner } from "@/hooks/use-code-runner";
import type { RunResult } from "@/lib/playground/types";
import { OutputTerminal } from "./output-terminal";
import { useGlobalRunner } from "./global-runner-context";

// The single CodeMirror instance for the whole page. Browser-only + heavy, so
// it is code-split and only fetched once the drawer first opens.
const CodeMirrorEditor = dynamic(
  () => import("./code-mirror-editor").then((m) => m.CodeMirrorEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center rounded-md border border-border bg-surface text-sm text-muted">
        Loading editor…
      </div>
    ),
  }
);

/**
 * `GlobalRunnerDrawer` — the singleton slide-out code runner.
 *
 * Rendered exactly once at the app root. It listens to `GlobalRunnerContext`
 * and presents a right-side panel (desktop) / bottom sheet (mobile) holding the
 * ONLY CodeMirror + runtime on the page. Snippets dispatch their code here
 * instead of each hydrating its own editor — eliminating multi-instance DOM
 * bloat and redundant Pyodide boots.
 *
 * The heavy inner content mounts lazily on first open and then persists, so the
 * editor + Python interpreter are reused across every subsequent snippet.
 */
export function GlobalRunnerDrawer() {
  const { isOpen, close } = useGlobalRunner();
  const [hasOpened, setHasOpened] = useState(false);

  // Mount the expensive inner content the first time the drawer is opened.
  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={close}
        className={`fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel: bottom sheet on mobile, right side-panel on sm+ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Code runner"
        className={`fixed z-[60] flex flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out
          inset-x-0 bottom-0 h-[82vh] rounded-t-2xl border-t border-border
          sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-full sm:w-[480px] sm:max-w-[92vw]
          sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0
          ${
            isOpen
              ? "translate-y-0 sm:translate-x-0"
              : "translate-y-full sm:translate-y-0 sm:translate-x-full"
          }`}
      >
        {hasOpened ? <DrawerBody /> : null}
      </aside>
    </>
  );
}

/**
 * The hydrated drawer interior: a single editor + runtime fed by the context.
 * Re-seeds and auto-runs whenever a new snippet `token` arrives.
 */
function DrawerBody() {
  const { code: incomingCode, language, title, token, close } =
    useGlobalRunner();

  const [code, setCode] = useState(incomingCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const { run, status, isRunning, error } = useCodeRunner(language);

  const lang = getLanguage(language);
  const label = lang?.label ?? language;
  const booting = status === "loading";

  const lastToken = useRef<number>(-1);
  const pendingAutoRun = useRef(false);

  const execute = async (src: string) => {
    const res = await run(src);
    setResult(res);
  };

  // A new snippet was dispatched → load its code, clear old output, and queue
  // an auto-run for when the runtime is ready.
  useEffect(() => {
    if (token === lastToken.current) return;
    lastToken.current = token;
    setCode(incomingCode);
    setResult(null);
    pendingAutoRun.current = true;
  }, [token, incomingCode]);

  // Fire the queued auto-run once the runtime reports ready. Runs the freshly
  // dispatched `incomingCode` (not the editor's prior content) so re-clicking a
  // snippet always executes what was just pasted in.
  useEffect(() => {
    if (pendingAutoRun.current && status === "ready") {
      pendingAutoRun.current = false;
      void execute(incomingCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {title ?? "Code Runner"}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close runner"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        <CodeMirrorEditor
          value={code}
          onChange={setCode}
          language={language}
          minHeight="14rem"
          ariaLabel="Global code editor"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border bg-surface-hover px-4 py-2">
        <button
          type="button"
          onClick={() => void execute(code)}
          disabled={isRunning || booting}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary disabled:opacity-50"
        >
          {isRunning || booting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {booting ? "Booting…" : isRunning ? "Running…" : "Run"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCode(incomingCode);
            setResult(null);
          }}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Output */}
      <div className="max-h-[40%] shrink-0 overflow-auto border-t border-border">
        {error ? (
          <div className="px-4 py-3 text-sm text-red-500">{error}</div>
        ) : (
          <OutputTerminal result={result} busy={isRunning || booting} />
        )}
      </div>
    </div>
  );
}

export default GlobalRunnerDrawer;
