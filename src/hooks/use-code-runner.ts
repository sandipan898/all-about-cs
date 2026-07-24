"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLanguage } from "@/lib/playground/languages";
import {
  getPyodide,
  runJavaScript,
  runPython,
  type PyodideInstance,
} from "@/lib/playground/client-runtimes";
import type { RunResult, RunnerStatus } from "@/lib/playground/types";
import { yieldToMain } from "@/lib/utils";

interface UseCodeRunnerReturn {
  /** Current runtime lifecycle state. */
  status: RunnerStatus;
  /** Non-null when a client runtime failed to initialize. */
  error: string | null;
  /** True while user code is executing. */
  isRunning: boolean;
  /** Execute source for the active language, resolving with captured output. */
  run: (code: string, stdin?: string) => Promise<RunResult>;
}

/**
 * `useCodeRunner` — one hook that dispatches execution to the correct target
 * based on the language registry:
 *
 *  - `client-python` → Pyodide (Wasm), eagerly booted on mount.
 *  - `client-js`     → sandboxed Web Worker.
 *  - `server`        → POST `/api/execute` (Wandbox proxy).
 *
 * Hooks are always called unconditionally; only the *effect body* branches, so
 * the rules-of-hooks invariant holds across language switches.
 */
export function useCodeRunner(languageId: string): UseCodeRunnerReturn {
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const mountedRef = useRef(true);

  const target = getLanguage(languageId)?.target ?? "server";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Warm up Pyodide eagerly (it is the slow runtime to boot). For client-js and
  // server targets there is nothing to pre-load, so we report "ready".
  useEffect(() => {
    if (target !== "client-python") {
      setStatus("ready");
      setError(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getPyodide()
      .then((py) => {
        if (cancelled) return;
        pyodideRef.current = py;
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Runtime failed to load."
        );
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const run = useCallback(
    async (code: string, stdin?: string): Promise<RunResult> => {
      setStatus("running");
      await yieldToMain();
      try {
        if (target === "client-python") {
          return await runPython(code, pyodideRef.current ?? undefined, stdin);
        }
        if (target === "client-js") {
          return await runJavaScript(code, stdin);
        }
        return await runOnServer(languageId, code, stdin);
      } finally {
        if (mountedRef.current) setStatus("ready");
      }
    },
    [target, languageId]
  );

  return { status, error, isRunning: status === "running", run };
}

/** POST to the Wandbox proxy and normalize the result. */
async function runOnServer(
  language: string,
  code: string,
  stdin?: string
): Promise<RunResult> {
  const started = performance.now();
  try {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin: stdin ?? "" }),
    });
    const data = (await res.json()) as Partial<RunResult> & {
      error?: string;
    };
    if (!res.ok) {
      return {
        stdout: "",
        stderr: data.error ?? `Request failed (${res.status}).`,
        durationMs: Math.round(performance.now() - started),
        ok: false,
      };
    }
    return {
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      durationMs: data.durationMs ?? Math.round(performance.now() - started),
      ok: data.ok ?? false,
    };
  } catch (err) {
    return {
      stdout: "",
      stderr:
        err instanceof Error
          ? err.message
          : "Network error while contacting the execution backend.",
      durationMs: Math.round(performance.now() - started),
      ok: false,
    };
  }
}
