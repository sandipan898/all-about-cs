/**
 * Shared type contracts for the Hybrid Execution Architecture (Phase 2).
 *
 * Framework-agnostic (no React / DOM imports) so they can be consumed by:
 *   - client components (SnippetRunner, PlaygroundClient),
 *   - the unified `useCodeRunner` hook + client runtimes,
 *   - and the server-side `/api/execute` proxy.
 *
 * One source of truth lets the code → execution pipeline speak a single,
 * strongly-typed language end to end.
 */

/**
 * Where a given language's code is executed.
 *  - `client-python` → Pyodide (Wasm) in the browser.
 *  - `client-js`     → sandboxed Web Worker in the browser.
 *  - `server`        → POST to `/api/execute` (Piston proxy) for compiled / other langs.
 */
export type ExecutionTarget = "client-python" | "client-js" | "server";

/** Lifecycle of the underlying Wasm / Worker runtime. */
export type RunnerStatus =
  | "idle" // runtime not requested yet
  | "loading" // runtime is downloading / booting
  | "ready" // runtime booted, awaiting input
  | "running" // user code currently executing
  | "error"; // runtime failed to initialize

/** Normalized result of a single code execution. */
export interface RunResult {
  /** Captured standard output (joined). */
  stdout: string;
  /** Captured standard error / exception text. */
  stderr: string;
  /** Wall-clock execution time in milliseconds. */
  durationMs: number;
  /** True when execution completed without throwing. */
  ok: boolean;
}
