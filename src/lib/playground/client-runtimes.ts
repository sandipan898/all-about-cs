/**
 * Client-side execution runtimes (browser only).
 *
 * Pure, framework-free functions extracted from the former `useWasmRunner`
 * hook so they can be unit-tested and reused by `useCodeRunner`:
 *   - Python    → Pyodide (Wasm) loaded lazily from CDN, booted once per tab.
 *   - JavaScript → a sandboxed Web Worker with a console shim + hard timeout.
 *
 * These touch `window` / `Worker`, so only import them from `"use client"`
 * modules and invoke them after mount.
 */

import type { RunResult } from "./types";

// ── Pyodide runtime (Python) ───────────────────────────────────────

/**
 * Pinned Pyodide build. Loaded from the official jsDelivr CDN so the platform
 * ships ZERO extra npm bytes and incurs ZERO server compute — the Python
 * interpreter boots entirely in the visitor's browser.
 */
const PYODIDE_VERSION = "0.27.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Minimal structural type for the bits of Pyodide we touch. */
export interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
  setStdin: (opts: {
    stdin: () => string | null;
    autoEOF?: boolean;
    isatty?: boolean;
  }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInstance>;
    /** Module-level singleton promise so the heavy runtime loads once per tab. */
    __aacsPyodide?: Promise<PyodideInstance>;
  }
}

/** Inject the Pyodide loader script exactly once. */
function ensurePyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.loadPyodide) return resolve();

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
export function getPyodide(): Promise<PyodideInstance> {
  if (window.__aacsPyodide) return window.__aacsPyodide;
  window.__aacsPyodide = ensurePyodideScript().then(() => {
    if (!window.loadPyodide) throw new Error("Pyodide loader unavailable.");
    return window.loadPyodide({ indexURL: PYODIDE_CDN });
  });
  return window.__aacsPyodide;
}

/** Run Python source on a (possibly pre-booted) interpreter. */
export async function runPython(
  code: string,
  instance?: PyodideInstance,
  stdin?: string
): Promise<RunResult> {
  const py = instance ?? (await getPyodide());

  const started = performance.now();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (t) => (stdout += t + "\n") });
  py.setStderr({ batched: (t) => (stderr += t + "\n") });

  // Feed any provided input to `input()` / `sys.stdin`, one line per read.
  // Returning `null` once the buffer is exhausted raises EOFError, mirroring
  // CPython's behavior when stdin reaches end-of-file.
  const inputLines =
    stdin && stdin.length > 0 ? stdin.replace(/\n$/, "").split("\n") : [];
  let inputIdx = 0;
  py.setStdin({
    stdin: () => (inputIdx < inputLines.length ? inputLines[inputIdx++] : null),
  });

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
    const { code, stdin } = e.data;
    // Batch input: feed one line per readline()/prompt() call, EOF -> null.
    const __inLines = stdin ? String(stdin).replace(/\\n$/, "").split("\\n") : [];
    let __inIdx = 0;
    const readline = () => (__inIdx < __inLines.length ? __inLines[__inIdx++] : null);
    const prompt = (message) => {
      if (message != null && message !== "") send("out", [message]);
      return readline();
    };
    try {
      // Indirect eval keeps user code in global (non-leaking) scope.
      const run = new Function("console", "prompt", "readline", "return (async () => {" + code + "\\n})()");
      await run(console, prompt, readline);
      self.postMessage({ type: "done", ok: true });
    } catch (err) {
      send("err", [err && err.stack ? err.stack : String(err)]);
      self.postMessage({ type: "done", ok: false });
    }
  };
`;

/** Max time a JS execution may run before the worker is force-terminated. */
const JS_TIMEOUT_MS = 5_000;

/** Run JavaScript source in a disposable, sandboxed Web Worker. */
export function runJavaScript(code: string, stdin?: string): Promise<RunResult> {
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
    worker.postMessage({ code, stdin: stdin ?? "" });
  });
}
