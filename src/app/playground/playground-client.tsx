"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Play, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import { LANGUAGE_LIST, getLanguage } from "@/lib/playground/languages";
import { useCodeRunner } from "@/hooks/use-code-runner";
import type { RunResult } from "@/lib/playground/types";
import { OutputTerminal } from "@/components/playground/output-terminal";
import { trackEvent } from "@/lib/analytics";

const CodeMirrorEditor = dynamic(
  () =>
    import("@/components/playground/code-mirror-editor").then(
      (m) => m.CodeMirrorEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-md border border-border bg-surface text-sm text-muted">
        Loading editor…
      </div>
    ),
  }
);

/**
 * `PlaygroundClient` — the standalone, multi-language IDE.
 *
 * Language selection drives `useCodeRunner`, which resolves the execution
 * target (browser for Python/JS, `/api/execute` proxy for compiled languages).
 * The editor theme is synced to `next-themes` inside `CodeMirrorEditor`.
 */
export function PlaygroundClient() {
  const [languageId, setLanguageId] = useState("python");
  const lang = getLanguage(languageId)!;

  const [code, setCode] = useState(lang.defaultCode);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [showStdin, setShowStdin] = useState(false);

  const { run, status, isRunning, error } = useCodeRunner(languageId);
  const booting = status === "loading";

  // Fire once when the standalone IDE mounts — baseline "did they open it?".
  useEffect(() => {
    trackEvent("playground_opened");
  }, []);

  const onSelectLanguage = (id: string) => {
    const next = getLanguage(id);
    if (!next) return;
    setLanguageId(id);
    setCode(next.defaultCode);
    setResult(null);
  };

  const execute = async () => {
    const res = await run(code, stdin);
    setResult(res);
  };

  const targetHint = useMemo(() => {
    switch (lang.target) {
      case "client-python":
        return "Runs in your browser via Pyodide (WebAssembly). For input(), type each value on its own line in the input box.";
      case "client-js":
        return "Runs in your browser in a sandboxed Web Worker. Read input with prompt() or readline() from the input box.";
      default:
        return "Compiled and run securely on the server. stdin is read from the input box.";
    }
  }, [lang.target]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-hover px-4 py-3">
        <div className="relative">
          <select
            value={languageId}
            onChange={(e) => onSelectLanguage(e.target.value)}
            aria-label="Select language"
            className="appearance-none rounded-md border border-border bg-surface py-1.5 pl-3 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LANGUAGE_LIST.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>

        <button
          type="button"
          onClick={() => void execute()}
          disabled={isRunning || booting}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:opacity-50"
        >
          {isRunning || booting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {booting ? "Booting…" : isRunning ? "Running…" : "Run"}
        </button>

        <button
          type="button"
          onClick={() => {
            setCode(lang.defaultCode);
            setResult(null);
          }}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        <button
          type="button"
          onClick={() => setShowStdin((s) => !s)}
          className="ml-auto text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          {showStdin ? "Hide input" : "Add input"}
        </button>
      </div>

      {/* Editor */}
      <div className="p-4">
        <CodeMirrorEditor
          value={code}
          onChange={setCode}
          language={languageId}
          minHeight="18rem"
          ariaLabel="Playground code editor"
        />

        {showStdin && (
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Input (stdin) — one value per line, fed to input() / prompt() / scanf…"
            rows={3}
            className="mt-3 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        )}

        <p className="mt-2 text-xs text-muted">{targetHint}</p>
      </div>

      {/* Output */}
      <div className="border-t border-border">
        {error ? (
          <div className="px-4 py-3 text-sm text-red-500">{error}</div>
        ) : (
          <OutputTerminal result={result} busy={isRunning || booting} />
        )}
      </div>
    </div>
  );
}

export default PlaygroundClient;
