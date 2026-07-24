/**
 * Yields execution back to the browser main thread before starting heavy CPU
 * or asynchronous tasks (e.g. WASM boot, Web Workers, heavy DOM mounts).
 *
 * Uses the modern `scheduler.yield()` API if supported by the browser (Chrome 129+, Edge 129+),
 * falling back to `setTimeout(0)`.
 *
 * This ensures Interaction to Next Paint (INP) remains well under 200ms for Core Web Vitals.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
 */
export async function yieldToMain(): Promise<void> {
  if (
    typeof window !== "undefined" &&
    "scheduler" in window &&
    typeof (window as unknown as { scheduler: { yield?: () => Promise<void> } }).scheduler.yield === "function"
  ) {
    try {
      await (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
      return;
    } catch {
      // Fallback below
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}
