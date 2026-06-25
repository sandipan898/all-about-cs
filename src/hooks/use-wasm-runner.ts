"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlaygroundLanguage,
  RunResult,
  RunnerStatus,
} from "@/lib/playground/types";

// ── Pyodide runtime (Python) ───────────────────────────────────────

/**
 * Pinned Pyodide build. Loaded lazily from the official jsDelivr CDN so the
 * platform ships ZERO extra npm bytes and incurs ZERO server compute — the
 * Python interpreter boots entirely in the visitor's browser.
 */
const PYODIDE_VERSION = "0.27.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Minimal structural type matching the official Pyodide configuration */
interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
  setStdin: (opts: any) => void; // Added to satisfy the official package declaration
}

// Bypasses global strict matching by extending standard record parameters
interface ExtendedWindow {
  loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
  __aacsPyodide?: Promise<any>;
}

/** Inject the Pyodide loader script exactly once. */
function ensurePyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    
    const win = window as ExtendedWindow;
    if (win.loadPyodide) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-pyodide]"
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("pyodide")));
      return;
    }

    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodide = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide runtime."));
    document.head.appendChild(script);
  });
}

/** Boot (or reuse) a single Pyodide interpreter for the whole tab. */
function getPyodide(): Promise<PyodideInstance> {
  const win = window as ExtendedWindow;
  if (win.__aacsPyodide) return win.__aacsPyodide;
  
  win.__aacsPyodide = ensurePyodideScript().then(() => {
    if (!win.loadPyodide) throw new Error("Pyodide loader unavailable.");
    return win.loadPyodide({ indexURL: PYODIDE_CDN });
  });
  return win.__aacsPyodide;
}

// ── JavaScript runtime (sandboxed Web Worker) ──────────────────────

/**
 * Worker source executed in an isolated context. It cannot touch the host
 * DOM, cookies, or localStorage — user code only sees a console shim that
 * streams logs back to the main thread.
 */
const JS_WORKER_SOURCE = /* js */ `
  const send = (stream, args) => self.postMessage({
    type: "log",
    stream,
    text: args.map((a) => {
      try {
        return typeof a === "string" ? a : JSON.stringify(a, null, 2);
      } catch {
        return String(a);
      }
    }).join(" "),
  });
  const console = {
    log: (...a) => send("out", a),
    info: (...a) => send("out", a),
    warn: (...a) => send("out", a),
    error: (...a) => send("err", a),
    debug: (...a) => send("out", a),
  };
  self.onmessage = async (e) => {
    try {
      // Indirect eval keeps user code in global (non-leaking) scope.
      const run = new Function("console", "return (async () => {" + e.data + "\\n})()");
      await run(console);
      self.postMessage({ type: "done", ok: true });
    } catch (err) {
      send("err", [err && err.stack ? err.stack : String(err)]);
      self.postMessage({ type: "done", ok: false });
    }
  };
`;

/** Max time a JS execution may run before the worker is force-terminated. */
const JS_TIMEOUT_MS = 5_000;

function runJavaScript(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    let stdout = "";
    let stderr = "";

    const blob = new Blob([JS_WORKER_SOURCE], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (ok: boolean, extraErr?: string) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (extraErr) stderr += (stderr ? "\n" : "") + extraErr;
      resolve({
        stdout,
        stderr,
        ok,
        durationMs: Math.round(performance.now() - started),
      });
    };

    const timer = setTimeout(
      () => finish(false, `Execution timed out after ${JS_TIMEOUT_MS} ms.`),
      JS_TIMEOUT_MS
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as
        | { type: "log"; stream: "out" | "err"; text: string }
        | { type: "done"; ok: boolean };
      if (msg.type === "log") {
        if (msg.stream === "out") stdout += msg.text + "\n";
        else stderr += msg.text + "\n";
      } else {
        finish(msg.ok);
      }
    };
    worker.onerror = (e) => finish(false, e.message);
    worker.postMessage(code);
  });
}

// ── Public hook ────────────────────────────────────────────────────

interface UseWasmRunnerReturn {
  status: RunnerStatus;
  /** Non-null when the runtime failed to initialize. */
  error: string | null;
  /** True while user code is executing. */
  isRunning: boolean;
  /** Execute source, resolving with captured stdout/stderr. */
  run: (code: string) => Promise<RunResult>;
}

/**
 * `useWasmRunner` — initializes a client-side execution environment for the
 * given language and exposes a single `run(code)` call that returns captured
 * stdout / stderr.
 *
 * - Python  → Pyodide (Wasm) loaded lazily from CDN, booted once per tab.
 * - JavaScript → a sandboxed Web Worker with a console shim + hard timeout.
 *
 * The runtime is requested only after the component mounts in the browser,
 * keeping the MDX server render (RSC/SSG) completely untouched.
 */
export function useWasmRunner(
  language: PlaygroundLanguage
): UseWasmRunnerReturn {
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Warm up the Python interpreter eagerly (it is the slow one to boot).
  useEffect(() => {
    if (language !== "python") {
      setStatus("ready");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    getPyodide()
      .then((py) => {
        if (cancelled) return;
        pyodideRef.current = py;
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Runtime failed to load.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const runPython = useCallback(async (code: string): Promise<RunResult> => {
    const py = pyodideRef.current ?? (await getPyodide());
    pyodideRef.current = py;

    const started = performance.now();
    let stdout = "";
    let stderr = "";
    py.setStdout({ batched: (t) => (stdout += t + "\n") });
    py.setStderr({ batched: (t) => (stderr += t + "\n") });

    let ok = true;
    try {
      await py.runPythonAsync(code);
    } catch (err) {
      ok = false;
      stderr += (err instanceof Error ? err.message : String(err)) + "\n";
    }
    return {
      stdout,
      stderr,
      ok,
      durationMs: Math.round(performance.now() - started),
    };
  }, []);

  const run = useCallback(
    async (code: string): Promise<RunResult> => {
      setStatus("running");
      try {
        const result =
          language === "python"
            ? await runPython(code)
            : await runJavaScript(code);
        return result;
      } finally {
        if (mountedRef.current) setStatus("ready");
      }
    },
    [language, runPython]
  );

  return {
    status,
    error,
    isRunning: status === "running",
    run,
  };
}
